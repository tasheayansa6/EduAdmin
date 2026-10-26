import { pool } from '../db/pool.js';
import { AppError } from '../lib/errors.js';
import { logActivity } from '../lib/activity.js';
import { notifyAllStudents } from '../lib/notify.js';
import {
  asOutline,
  assignLessonIds,
  asStringList,
  outlineToText,
  parseJson,
  totalMinutesFromOutline,
} from '../lib/courseDetails.js';
import { likeClause, likePattern, toPage } from '../lib/sql.js';

function mapCourse(row) {
  const outline = asOutline(row.outline);
  const outcomes = asStringList(row.outcomes);
  const requirements = asStringList(row.requirements);
  const includes = asStringList(row.includes);
  const totalMinutes = row.total_minutes == null
    ? totalMinutesFromOutline(outline)
    : Number(row.total_minutes);
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? null,
    description: row.description,
    imageUrl: row.image_url ?? null,
    previewVideoUrl: row.preview_video_url ?? null,
    instructorName: row.instructor_name ?? null,
    level: row.level ?? null,
    language: row.language || 'English',
    totalMinutes,
    outcomes,
    requirements,
    includes,
    outline,
    outlineText: outlineToText(outline),
    outcomesText: outcomes.join('\n'),
    requirementsText: requirements.join('\n'),
    includesText: includes.join('\n'),
    categoryId: row.category_id,
    categoryName: row.category_name,
    status: row.status,
    price: Number(row.price ?? 0),
    currency: row.currency || 'ETB',
    sourceSlug: row.source_slug ?? null,
    enrollmentCount: Number(row.enrollment_count ?? 0),
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

function filters(query) {
  const where = ['1 = 1'];
  const params = [];
  if (query.q) {
    where.push(`(${likeClause('c.title')} OR ${likeClause('c.description')} OR ${likeClause('c.subtitle')})`);
    const pattern = likePattern(query.q);
    params.push(pattern, pattern, pattern);
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
  SELECT c.id, c.title, c.subtitle, c.description, c.image_url, c.preview_video_url, c.instructor_name,
         c.level, c.language, c.total_minutes, c.outcomes, c.requirements, c.includes, c.outline,
         c.category_id, c.status, c.price, c.currency, c.source_slug, c.created_at, c.updated_at,
         cat.name AS category_name,
         (SELECT COUNT(*) FROM enrollments e
           WHERE e.course_id = c.id AND e.status <> 'withdrawn') AS enrollment_count
  FROM courses c
  JOIN categories cat ON cat.id = c.category_id
`;

function detailValues(body) {
  const outline = assignLessonIds(body.outline ?? []);
  const minutes = body.totalMinutes == null ? totalMinutesFromOutline(outline) : body.totalMinutes;
  return {
    subtitle: body.subtitle ?? null,
    imageUrl: body.imageUrl ?? null,
    previewVideoUrl: body.previewVideoUrl ?? null,
    instructorName: body.instructorName ?? null,
    level: body.level ?? null,
    language: body.language || 'English',
    totalMinutes: minutes || null,
    outcomes: JSON.stringify(body.outcomes ?? []),
    requirements: JSON.stringify(body.requirements ?? []),
    includes: JSON.stringify(body.includes ?? []),
    outline: JSON.stringify(outline),
  };
}

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
  const details = detailValues(body);
  const [result] = await pool.query(
    `INSERT INTO courses
       (title, subtitle, description, image_url, preview_video_url, instructor_name, level, language,
        total_minutes, outcomes, requirements, includes, outline, category_id, status, price, currency, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), CAST(? AS JSON), CAST(? AS JSON), ?, ?, ?, ?, ?)`,
    [
      body.title, details.subtitle, body.description, details.imageUrl, details.previewVideoUrl,
      details.instructorName, details.level, details.language, details.totalMinutes,
      details.outcomes, details.requirements, details.includes, details.outline,
      body.categoryId, body.status, body.price ?? 0, body.currency || 'ETB', actorId,
    ],
  );
  await logActivity(pool, {
    actorId,
    action: body.status === 'published' ? 'course.published' : 'course.created',
    entityType: 'course',
    entityId: result.insertId,
    details: body.status === 'published' ? `Published ${body.title}` : `Created ${body.title}`,
  });
  if (body.status === 'published') await announceCourse(result.insertId, body.title, body.description);
  return getCourse(result.insertId);
}

async function announceCourse(id, title, description) {
  await notifyAllStudents(pool, {
    type: 'course',
    title: `New course: ${title}`,
    body: description,
    link: `/learn/my-courses/${id}`,
  });
}

export async function updateCourse(actorId, id, body) {
  const current = await getCourse(id);
  if (body.categoryId) await assertCategory(body.categoryId);

  const sets = [];
  const params = [];
  const fields = [
    ['title', 'title'],
    ['subtitle', 'subtitle'],
    ['description', 'description'],
    ['imageUrl', 'image_url'],
    ['previewVideoUrl', 'preview_video_url'],
    ['instructorName', 'instructor_name'],
    ['level', 'level'],
    ['language', 'language'],
    ['totalMinutes', 'total_minutes'],
    ['categoryId', 'category_id'],
    ['status', 'status'],
    ['price', 'price'],
    ['currency', 'currency'],
  ];
  for (const [key, column] of fields) {
    if (body[key] !== undefined) {
      sets.push(`${column} = ?`);
      params.push(body[key]);
    }
  }
  for (const [key, column] of [['outcomes', 'outcomes'], ['requirements', 'requirements'], ['includes', 'includes'], ['outline', 'outline']]) {
    if (body[key] !== undefined) {
      sets.push(`${column} = CAST(? AS JSON)`);
      params.push(JSON.stringify(key === 'outline' ? asOutline(body[key]) : (body[key] ?? [])));
    }
  }
  if (body.outline !== undefined && body.totalMinutes === undefined) {
    sets.push('total_minutes = ?');
    params.push(totalMinutesFromOutline(body.outline));
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
  if (body.status === 'published' && current.status !== 'published' && !current.sourceSlug) {
    await announceCourse(id, body.title ?? current.title, body.description ?? current.description);
  }
  return getCourse(id);
}

/** Permanently delete a course. Related enrollments, progress, cart, and favorites cascade. */
export async function deleteCourse(actorId, id) {
  const current = await getCourse(id);
  if (!current) throw new AppError(404, 'Course not found.');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query('DELETE FROM courses WHERE id = ?', [id]);
    if (!result.affectedRows) throw new AppError(404, 'Course not found.');
    await logActivity(connection, {
      actorId,
      action: 'course.deleted',
      entityType: 'course',
      entityId: id,
      details: `Deleted ${current.title}`,
    });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return { id, deleted: true };
}

export { parseJson };
