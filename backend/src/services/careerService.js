import { pool } from '../db/pool.js';
import { AppError } from '../lib/errors.js';
import { logActivity } from '../lib/activity.js';
import { mailNotifyTo, sendEmail } from '../lib/mailer.js';
import { likeClause, likePattern, toPage } from '../lib/sql.js';
import { getContactInfo } from './contactService.js';

const DEFAULT_CAREERS_EMAIL = 'tasheayansa6@gmail.com';

function slugify(title) {
  const base = String(title || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
  return base || 'role';
}

function mapCareer(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    location: row.location ?? null,
    employmentType: row.employment_type,
    department: row.department ?? null,
    summary: row.summary ?? null,
    description: row.description,
    applicationEmail: row.application_email ?? DEFAULT_CAREERS_EMAIL,
    deadline: row.deadline ?? null,
    status: row.status,
    createdBy: row.created_by ?? null,
    publishedAt: row.published_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    applicationCount: row.application_count != null ? Number(row.application_count) : undefined,
  };
}

function mapApplication(row) {
  return {
    id: row.id,
    careerId: row.career_id,
    careerTitle: row.career_title ?? null,
    userId: row.user_id ?? null,
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    coverLetter: row.cover_letter,
    resumeUrl: row.resume_url ?? null,
    status: row.status,
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
        ? 'SELECT id FROM careers WHERE slug = ? AND id <> ? LIMIT 1'
        : 'SELECT id FROM careers WHERE slug = ? LIMIT 1',
      excludeId ? [candidate, excludeId] : [candidate],
    );
    if (!rows[0]) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
    if (n > 200) throw new AppError(500, 'Could not generate a unique career slug.');
  }
}

async function getCareerRow(id) {
  const [rows] = await pool.query('SELECT * FROM careers WHERE id = ?', [id]);
  if (!rows[0]) throw new AppError(404, 'Career posting not found.');
  return rows[0];
}

export async function listCareers(query) {
  const where = ['1=1'];
  const params = [];
  if (query.q) {
    where.push(`(${likeClause('c.title')} OR ${likeClause('c.location')} OR ${likeClause('c.department')})`);
    const pattern = likePattern(query.q);
    params.push(pattern, pattern, pattern);
  }
  if (query.status) {
    where.push('c.status = ?');
    params.push(query.status);
  }
  const clause = where.join(' AND ');
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM careers c WHERE ${clause}`, params);
  const offset = (query.page - 1) * query.limit;
  const [rows] = await pool.query(
    `SELECT c.*,
            (SELECT COUNT(*) FROM career_applications a WHERE a.career_id = c.id) AS application_count
     FROM careers c
     WHERE ${clause}
     ORDER BY COALESCE(c.published_at, c.created_at) DESC, c.id DESC
     LIMIT ? OFFSET ?`,
    [...params, query.limit, offset],
  );
  return toPage(rows.map(mapCareer), Number(countRows[0].total), query.page, query.limit);
}

export async function getCareer(id) {
  return mapCareer(await getCareerRow(id));
}

export async function createCareer(actorId, body) {
  const slug = await uniqueSlug(body.title);
  const status = body.status || 'draft';
  const publishedAt = status === 'open' ? new Date() : null;
  const applicationEmail = body.applicationEmail || DEFAULT_CAREERS_EMAIL;
  const [result] = await pool.query(
    `INSERT INTO careers
       (title, slug, location, employment_type, department, summary, description,
        application_email, deadline, status, created_by, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      body.title,
      slug,
      body.location ?? null,
      body.employmentType || 'Full time',
      body.department ?? null,
      body.summary ?? null,
      body.description,
      applicationEmail,
      body.deadline ?? null,
      status,
      actorId,
      publishedAt,
    ],
  );
  await logActivity(pool, {
    actorId,
    action: status === 'open' ? 'career.published' : 'career.created',
    entityType: 'career',
    entityId: result.insertId,
    details: `${status === 'open' ? 'Opened' : 'Drafted'} career “${body.title}”`,
  });
  return getCareer(result.insertId);
}

export async function updateCareer(actorId, id, body) {
  const existing = await getCareerRow(id);
  const title = body.title ?? existing.title;
  const slug = body.title && body.title !== existing.title
    ? await uniqueSlug(title, id)
    : existing.slug;
  const status = body.status ?? existing.status;
  let publishedAt = existing.published_at;
  if (status === 'open' && existing.status !== 'open') publishedAt = new Date();

  await pool.query(
    `UPDATE careers SET
       title = ?, slug = ?, location = ?, employment_type = ?, department = ?,
       summary = ?, description = ?, application_email = ?, deadline = ?, status = ?, published_at = ?
     WHERE id = ?`,
    [
      title,
      slug,
      body.location !== undefined ? body.location : existing.location,
      body.employmentType ?? existing.employment_type,
      body.department !== undefined ? body.department : existing.department,
      body.summary !== undefined ? body.summary : existing.summary,
      body.description ?? existing.description,
      body.applicationEmail !== undefined
        ? (body.applicationEmail || DEFAULT_CAREERS_EMAIL)
        : (existing.application_email || DEFAULT_CAREERS_EMAIL),
      body.deadline !== undefined ? body.deadline : existing.deadline,
      status,
      publishedAt,
      id,
    ],
  );

  let action = 'career.updated';
  if (status === 'open' && existing.status !== 'open') action = 'career.published';
  if (status === 'closed' && existing.status !== 'closed') action = 'career.closed';

  await logActivity(pool, {
    actorId,
    action,
    entityType: 'career',
    entityId: id,
    details: `Updated career “${title}”`,
  });
  return getCareer(id);
}

export async function deleteCareer(actorId, id) {
  const existing = await getCareerRow(id);
  await pool.query('DELETE FROM careers WHERE id = ?', [id]);
  await logActivity(pool, {
    actorId,
    action: 'career.deleted',
    entityType: 'career',
    entityId: id,
    details: `Deleted career “${existing.title}”`,
  });
  return { id, deleted: true };
}

export async function listOpenCareers(query = {}) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM careers WHERE status = 'open'`);
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `SELECT * FROM careers
     WHERE status = 'open'
     ORDER BY COALESCE(published_at, created_at) DESC, id DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  return toPage(rows.map(mapCareer), Number(countRows[0].total), page, limit);
}

export async function getOpenCareerBySlug(slug) {
  const [rows] = await pool.query(
    `SELECT * FROM careers WHERE slug = ? AND status = 'open'`,
    [slug],
  );
  if (!rows[0]) throw new AppError(404, 'Career posting not found.');
  return mapCareer(rows[0]);
}

export async function applyToCareer(userId, slug, body) {
  const career = await getOpenCareerBySlug(slug);
  if (career.deadline) {
    const due = new Date(`${career.deadline}T23:59:59Z`);
    if (!Number.isNaN(due.getTime()) && Date.now() > due.getTime()) {
      throw new AppError(400, 'The application deadline for this role has passed.');
    }
  }

  const [result] = await pool.query(
    `INSERT INTO career_applications
       (career_id, user_id, name, email, phone, cover_letter, resume_url, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'new')`,
    [
      career.id,
      userId || null,
      body.name,
      body.email,
      body.phone ?? null,
      body.coverLetter,
      body.resumeUrl ?? null,
    ],
  );

  await logActivity(pool, {
    actorId: userId || null,
    action: 'career.application_received',
    entityType: 'career_application',
    entityId: result.insertId,
    details: `${body.name} applied for ${career.title}`,
  });

  const notifyTo = career.applicationEmail || mailNotifyTo() || DEFAULT_CAREERS_EMAIL;
  try {
    await sendEmail({
      to: notifyTo,
      replyTo: body.email,
      subject: `Career application: ${career.title}`,
      text: [
        `New application for ${career.title}`,
        '',
        `Name: ${body.name}`,
        `Email: ${body.email}`,
        `Phone: ${body.phone || '—'}`,
        body.resumeUrl ? `Resume: ${body.resumeUrl}` : null,
        '',
        'Cover letter:',
        body.coverLetter,
      ].filter(Boolean).join('\n'),
    });
  } catch (error) {
    console.warn('[careers] notify email failed:', error.message);
  }

  const [rows] = await pool.query('SELECT * FROM career_applications WHERE id = ?', [result.insertId]);
  return mapApplication({ ...rows[0], career_title: career.title });
}

export async function listApplications(query) {
  const where = ['1=1'];
  const params = [];
  if (query.q) {
    where.push(`(${likeClause('a.name')} OR ${likeClause('a.email')} OR ${likeClause('c.title')})`);
    const pattern = likePattern(query.q);
    params.push(pattern, pattern, pattern);
  }
  if (query.status) {
    where.push('a.status = ?');
    params.push(query.status);
  }
  if (query.careerId) {
    where.push('a.career_id = ?');
    params.push(query.careerId);
  }
  const clause = where.join(' AND ');
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM career_applications a
     JOIN careers c ON c.id = a.career_id
     WHERE ${clause}`,
    params,
  );
  const offset = (query.page - 1) * query.limit;
  const [rows] = await pool.query(
    `SELECT a.*, c.title AS career_title
     FROM career_applications a
     JOIN careers c ON c.id = a.career_id
     WHERE ${clause}
     ORDER BY a.created_at DESC, a.id DESC
     LIMIT ? OFFSET ?`,
    [...params, query.limit, offset],
  );
  return toPage(rows.map(mapApplication), Number(countRows[0].total), query.page, query.limit);
}

export async function updateApplicationStatus(actorId, id, status) {
  const [rows] = await pool.query('SELECT * FROM career_applications WHERE id = ?', [id]);
  if (!rows[0]) throw new AppError(404, 'Application not found.');
  await pool.query('UPDATE career_applications SET status = ? WHERE id = ?', [status, id]);
  await logActivity(pool, {
    actorId,
    action: 'career.application_updated',
    entityType: 'career_application',
    entityId: id,
    details: `Marked application as ${status}`,
  });
  const [updated] = await pool.query(
    `SELECT a.*, c.title AS career_title
     FROM career_applications a
     JOIN careers c ON c.id = a.career_id
     WHERE a.id = ?`,
    [id],
  );
  return mapApplication(updated[0]);
}

/** Prefer contact email, else careers default. */
export async function resolveCareersInbox() {
  try {
    const info = await getContactInfo();
    return info.email || DEFAULT_CAREERS_EMAIL;
  } catch {
    return DEFAULT_CAREERS_EMAIL;
  }
}

export { DEFAULT_CAREERS_EMAIL };
