import { pool } from '../db/pool.js';
import { AppError } from '../lib/errors.js';
import { logActivity } from '../lib/activity.js';
import { likeClause, likePattern, toPage } from '../lib/sql.js';

function slugify(title) {
  const base = String(title || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
  return base || 'post';
}

function mapBlog(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? null,
    body: row.body,
    coverImageUrl: row.cover_image_url ?? null,
    status: row.status,
    authorId: row.author_id ?? null,
    authorName: row.author_name ?? null,
    publishedAt: row.published_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function uniqueSlug(title, excludeId = null) {
  const base = slugify(title);
  let candidate = base;
  let n = 2;
  for (;;) {
    const [rows] = await pool.query(
      excludeId
        ? 'SELECT id FROM blogs WHERE slug = ? AND id <> ? LIMIT 1'
        : 'SELECT id FROM blogs WHERE slug = ? LIMIT 1',
      excludeId ? [candidate, excludeId] : [candidate],
    );
    if (!rows[0]) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
    if (n > 200) throw new AppError(500, 'Could not generate a unique blog slug.');
  }
}

async function getBlogRow(id) {
  const [rows] = await pool.query(
    `SELECT b.*, u.name AS author_name
     FROM blogs b
     LEFT JOIN users u ON u.id = b.author_id
     WHERE b.id = ?`,
    [id],
  );
  if (!rows[0]) throw new AppError(404, 'Blog post not found.');
  return rows[0];
}

export async function listBlogs(query) {
  const where = ['1=1'];
  const params = [];
  if (query.q) {
    where.push(`(${likeClause('b.title')} OR ${likeClause('b.excerpt')} OR ${likeClause('b.body')})`);
    const pattern = likePattern(query.q);
    params.push(pattern, pattern, pattern);
  }
  if (query.status) {
    where.push('b.status = ?');
    params.push(query.status);
  }
  const clause = where.join(' AND ');
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM blogs b WHERE ${clause}`,
    params,
  );
  const offset = (query.page - 1) * query.limit;
  const [rows] = await pool.query(
    `SELECT b.*, u.name AS author_name
     FROM blogs b
     LEFT JOIN users u ON u.id = b.author_id
     WHERE ${clause}
     ORDER BY COALESCE(b.published_at, b.created_at) DESC, b.id DESC
     LIMIT ? OFFSET ?`,
    [...params, query.limit, offset],
  );
  return toPage(rows.map(mapBlog), Number(countRows[0].total), query.page, query.limit);
}

export async function getBlog(id) {
  return mapBlog(await getBlogRow(id));
}

export async function createBlog(actorId, body) {
  const slug = await uniqueSlug(body.title);
  const status = body.status || 'draft';
  const publishedAt = status === 'published' ? new Date() : null;
  const [result] = await pool.query(
    `INSERT INTO blogs (title, slug, excerpt, body, cover_image_url, status, author_id, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      body.title,
      slug,
      body.excerpt ?? null,
      body.body,
      body.coverImageUrl ?? null,
      status,
      actorId,
      publishedAt,
    ],
  );
  await logActivity(pool, {
    actorId,
    action: status === 'published' ? 'blog.published' : 'blog.created',
    entityType: 'blog',
    entityId: result.insertId,
    details: `${status === 'published' ? 'Published' : 'Drafted'} blog “${body.title}”`,
  });
  return getBlog(result.insertId);
}

export async function updateBlog(actorId, id, body) {
  const existing = await getBlogRow(id);
  const title = body.title ?? existing.title;
  const slug = body.title && body.title !== existing.title
    ? await uniqueSlug(title, id)
    : existing.slug;
  const status = body.status ?? existing.status;
  let publishedAt = existing.published_at;
  if (status === 'published' && existing.status !== 'published') {
    publishedAt = new Date();
  }
  if (status === 'draft') {
    publishedAt = existing.status === 'published' ? existing.published_at : null;
  }

  await pool.query(
    `UPDATE blogs
     SET title = ?, slug = ?, excerpt = ?, body = ?, cover_image_url = ?, status = ?, published_at = ?
     WHERE id = ?`,
    [
      title,
      slug,
      body.excerpt !== undefined ? body.excerpt : existing.excerpt,
      body.body ?? existing.body,
      body.coverImageUrl !== undefined ? body.coverImageUrl : existing.cover_image_url,
      status,
      publishedAt,
      id,
    ],
  );

  let action = 'blog.updated';
  if (status === 'published' && existing.status !== 'published') action = 'blog.published';
  if (status === 'draft' && existing.status === 'published') action = 'blog.unpublished';

  await logActivity(pool, {
    actorId,
    action,
    entityType: 'blog',
    entityId: id,
    details: `Updated blog “${title}”`,
  });
  return getBlog(id);
}

export async function deleteBlog(actorId, id) {
  const existing = await getBlogRow(id);
  const [result] = await pool.query('DELETE FROM blogs WHERE id = ?', [id]);
  if (!result.affectedRows) throw new AppError(404, 'Blog post not found.');
  await logActivity(pool, {
    actorId,
    action: 'blog.deleted',
    entityType: 'blog',
    entityId: id,
    details: `Deleted blog “${existing.title}”`,
  });
  return { id, deleted: true };
}

/** Published posts for students / public reading. */
export async function listPublishedBlogs(query = {}) {
  const page = query.page || 1;
  const limit = query.limit || 12;
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM blogs WHERE status = 'published'`,
  );
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `SELECT b.*, u.name AS author_name
     FROM blogs b
     LEFT JOIN users u ON u.id = b.author_id
     WHERE b.status = 'published'
     ORDER BY b.published_at DESC, b.id DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  return toPage(rows.map(mapBlog), Number(countRows[0].total), page, limit);
}

export async function getPublishedBlogBySlug(slug) {
  const [rows] = await pool.query(
    `SELECT b.*, u.name AS author_name
     FROM blogs b
     LEFT JOIN users u ON u.id = b.author_id
     WHERE b.slug = ? AND b.status = 'published'`,
    [slug],
  );
  if (!rows[0]) throw new AppError(404, 'Blog post not found.');
  return mapBlog(rows[0]);
}
