import { pool } from '../db/pool.js';
import { AppError } from '../lib/errors.js';
import { logActivity } from '../lib/activity.js';
import { likeClause, likePattern, toPage } from '../lib/sql.js';

function mapEnrollment(row) {
  return {
    id: row.id,
    status: row.status,
    enrolledAt: row.enrolled_at,
    userId: row.user_id,
    studentName: row.student_name,
    email: row.email,
    courseId: row.course_id,
    courseTitle: row.course_title,
    percent: row.percent == null ? null : Number(row.percent),
    progressStatus: row.progress_status ?? null,
    progressUpdatedAt: row.progress_updated_at ?? null,
  };
}

function filters(query) {
  const where = ['1 = 1'];
  const params = [];
  if (query.q) {
    where.push(`(${likeClause('u.name')} OR ${likeClause('u.email')} OR ${likeClause('c.title')})`);
    const pattern = likePattern(query.q);
    params.push(pattern, pattern, pattern);
  }
  if (query.status) {
    where.push('e.status = ?');
    params.push(query.status);
  }
  if (query.courseId) {
    where.push('e.course_id = ?');
    params.push(query.courseId);
  }
  return { clause: where.join(' AND '), params };
}

const enrollmentSelect = `
  SELECT e.id, e.status, e.enrolled_at, e.user_id, e.course_id,
         u.name AS student_name, u.email, c.title AS course_title,
         p.percent AS percent,
         p.status AS progress_status,
         p.updated_at AS progress_updated_at
  FROM enrollments e
  JOIN users u ON u.id = e.user_id
  JOIN courses c ON c.id = e.course_id
  LEFT JOIN progress p ON p.user_id = e.user_id AND p.course_id = e.course_id
`;

async function findEnrollment(id, executor = pool) {
  const [rows] = await executor.query(`${enrollmentSelect} WHERE e.id = ?`, [id]);
  if (!rows[0]) throw new AppError(404, 'Enrollment not found.');
  return rows[0];
}

export async function getEnrollment(id) {
  return mapEnrollment(await findEnrollment(id));
}

export async function listEnrollments(query) {
  const { clause, params } = filters(query);
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM enrollments e
     JOIN users u ON u.id = e.user_id
     JOIN courses c ON c.id = e.course_id
     WHERE ${clause}`,
    params,
  );
  const offset = (query.page - 1) * query.limit;
  const [rows] = await pool.query(
    `${enrollmentSelect} WHERE ${clause} ORDER BY e.enrolled_at DESC LIMIT ? OFFSET ?`,
    [...params, query.limit, offset],
  );
  return toPage(rows.map(mapEnrollment), Number(countRows[0].total), query.page, query.limit);
}

export async function createEnrollment(actorId, { userId, courseId }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [students] = await connection.query(
      `SELECT id, name, role, status FROM users WHERE id = ? FOR UPDATE`,
      [userId],
    );
    const student = students[0];
    if (!student || student.role !== 'student') {
      throw new AppError(400, 'Choose a valid student.', [
        { field: 'userId', message: 'Choose a valid student.' },
      ]);
    }
    if (student.status !== 'active') {
      throw new AppError(400, 'Only active students can be enrolled.', [
        { field: 'userId', message: 'Only active students can be enrolled.' },
      ]);
    }

    const [courses] = await connection.query(
      `SELECT id, title, status FROM courses WHERE id = ?`,
      [courseId],
    );
    if (!courses[0]) {
      throw new AppError(400, 'Choose a valid course.', [
        { field: 'courseId', message: 'Choose a valid course.' },
      ]);
    }
    if (courses[0].status !== 'published') {
      throw new AppError(400, 'Students can only be enrolled in published courses.', [
        { field: 'courseId', message: 'Choose a published course.' },
      ]);
    }

    const [existingRows] = await connection.query(
      'SELECT id, status FROM enrollments WHERE user_id = ? AND course_id = ? FOR UPDATE',
      [userId, courseId],
    );
    const existing = existingRows[0];
    if (existing && existing.status !== 'withdrawn') {
      throw new AppError(409, 'This student is already enrolled in that course.');
    }

    let enrollmentId = existing?.id;
    if (existing) {
      await connection.query(
        `UPDATE enrollments SET status = 'active', enrolled_at = UTC_TIMESTAMP() WHERE id = ?`,
        [existing.id],
      );
    } else {
      const [result] = await connection.query(
        `INSERT INTO enrollments (user_id, course_id, status) VALUES (?, ?, 'active')`,
        [userId, courseId],
      );
      enrollmentId = result.insertId;
    }

    // Preserve existing progress when re-activating a withdrawn enrollment.
    await connection.query(
      `INSERT INTO progress (user_id, course_id, percent, status)
       VALUES (?, ?, 0, 'not_started')
       ON DUPLICATE KEY UPDATE user_id = user_id`,
      [userId, courseId],
    );

    await logActivity(connection, {
      actorId,
      action: 'enrollment.created',
      entityType: 'enrollment',
      entityId: enrollmentId,
      details: `${student.name} enrolled in ${courses[0].title}`,
    });

    const row = await findEnrollment(enrollmentId, connection);
    await connection.commit();
    return mapEnrollment(row);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateEnrollment(actorId, id, status) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const current = await findEnrollment(id, connection);

    if (status === 'completed') {
      await connection.query(
        `UPDATE progress SET percent = 100, status = 'completed'
         WHERE user_id = ? AND course_id = ?`,
        [current.user_id, current.course_id],
      );
    } else if (status === 'active' && current.status === 'completed') {
      await connection.query(
        `UPDATE progress
         SET status = 'in_progress', percent = LEAST(percent, 90)
         WHERE user_id = ? AND course_id = ?`,
        [current.user_id, current.course_id],
      );
    }

    await connection.query('UPDATE enrollments SET status = ? WHERE id = ?', [status, id]);
    await logActivity(connection, {
      actorId,
      action: 'enrollment.updated',
      entityType: 'enrollment',
      entityId: id,
      details: `${current.student_name} marked ${status.replace('_', ' ')} in ${current.course_title}`,
    });
    const row = await findEnrollment(id, connection);
    await connection.commit();
    return mapEnrollment(row);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/** Soft-cancel: mark withdrawn instead of deleting historical enrollment rows. */
export async function deleteEnrollment(actorId, id) {
  return updateEnrollment(actorId, id, 'withdrawn');
}
