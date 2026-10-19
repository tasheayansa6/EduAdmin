import { pool } from '../db/pool.js';
import { AppError } from '../lib/errors.js';
import { logActivity } from '../lib/activity.js';
import { likeClause, likePattern, toPage } from '../lib/sql.js';

function mapCourse(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    categoryId: row.category_id,
    categoryName: row.category_name,
    status: row.status,
    enrollmentCount: Number(row.enrollment_count ?? 0),
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

function filters(query) {
  const where = ['1 = 1'];
  const params = [];
  if (query.q) {
    where.push(`(${likeClause('c.title')} OR ${likeClause('c.description')})`);
    const pattern = likePattern(query.q);
    params.push(pattern, pattern);
  }
  if (query.status) {
    where.push('c.status = ?');
    params.push(query.status);
  }
  if (query.categoryId) {
    where.push('c.category_id = ?');
    params.push(query.categoryId);
  }
  return { clause: where.join(' AND '), params };
}

const courseSelect = `
  SELECT c.id, c.title, c.description, c.category_id, c.status, c.created_at, c.updated_at,
         cat.name AS category_name,
         (SELECT COUNT(*) FROM enrollments e
           WHERE e.course_id = c.id AND e.status <> 'withdrawn') AS enrollment_count
  FROM courses c
  JOIN categories cat ON cat.id = c.category_id
`;

export async function listCourses(query) {
  const { clause, params } = filters(query);
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM courses c
     JOIN categories cat ON cat.id = c.category_id
     WHERE ${clause}`,
    params,
  );
  const offset = (query.page - 1) * query.limit;
  const [rows] = await pool.query(
    `${courseSelect} WHERE ${clause} ORDER BY c.updated_at DESC, c.title ASC LIMIT ? OFFSET ?`,
    [...params, query.limit, offset],
  );
  return toPage(rows.map(mapCourse), Number(countRows[0].total), query.page, query.limit);
}

export async function getCourse(id) {
  const [rows] = await pool.query(`${courseSelect} WHERE c.id = ?`, [id]);
  if (!rows[0]) throw new AppError(404, 'Course not found.');
  return mapCourse(rows[0]);
}

async function assertCategory(categoryId) {
  const [rows] = await pool.query('SELECT id FROM categories WHERE id = ?', [categoryId]);
  if (!rows[0]) {
    throw new AppError(400, 'Choose a valid category.', [
      { field: 'categoryId', message: 'Choose a valid category.' },
    ]);
  }
}

export async function createCourse(actorId, body) {
  await assertCategory(body.categoryId);
  const [result] = await pool.query(
    `INSERT INTO courses (title, description, category_id, status, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [body.title, body.description, body.categoryId, body.status, actorId],
  );
  await logActivity(pool, {
    actorId,
    action: body.status === 'published' ? 'course.published' : 'course.created',
    entityType: 'course',
    entityId: result.insertId,
    details: body.status === 'published' ? `Published ${body.title}` : `Created ${body.title}`,
  });
  return getCourse(result.insertId);
}

export async function updateCourse(actorId, id, body) {
  const current = await getCourse(id);
  if (body.categoryId) await assertCategory(body.categoryId);

  const sets = [];
  const params = [];
  if (body.title !== undefined) {
    sets.push('title = ?');
    params.push(body.title);
  }
  if (body.description !== undefined) {
    sets.push('description = ?');
    params.push(body.description);
  }
  if (body.categoryId !== undefined) {
    sets.push('category_id = ?');
    params.push(body.categoryId);
  }
  if (body.status !== undefined) {
    sets.push('status = ?');
    params.push(body.status);
  }
  if (!sets.length) throw new AppError(400, 'Nothing to update.');

  await pool.query(`UPDATE courses SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);

  let action = 'course.updated';
  let details = `Updated ${body.title ?? current.title}`;
  if (body.status && body.status !== current.status) {
    action = body.status === 'published' ? 'course.published' : 'course.unpublished';
    details = body.status === 'published'
      ? `Published ${body.title ?? current.title}`
      : `Unpublished ${body.title ?? current.title}`;
  }

  await logActivity(pool, {
    actorId,
    action,
    entityType: 'course',
    entityId: id,
    details,
  });
  return getCourse(id);
}

/** Soft-remove: unpublish instead of hard-deleting course history. */
export async function deleteCourse(actorId, id) {
  return updateCourse(actorId, id, { status: 'draft' });
}
