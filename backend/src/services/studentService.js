import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';
import { AppError } from '../lib/errors.js';
import { logActivity } from '../lib/activity.js';
import { notify } from '../lib/notify.js';
import { likeClause, likePattern, toPage } from '../lib/sql.js';

function mapStudent(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
    enrollmentCount: Number(row.enrollment_count ?? 0),
  };
}

function filters(query) {
  const where = ['u.role = ?'];
  const params = ['student'];
  if (query.q) {
    where.push(`(${likeClause('u.name')} OR ${likeClause('u.email')})`);
    const pattern = likePattern(query.q);
    params.push(pattern, pattern);
  }
  if (query.status) {
    where.push('u.status = ?');
    params.push(query.status);
  }
  return { clause: where.join(' AND '), params };
}

export async function listStudents(query) {
  const { clause, params } = filters(query);
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM users u WHERE ${clause}`,
    params,
  );
  const offset = (query.page - 1) * query.limit;
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.status, u.created_at,
            (SELECT COUNT(*) FROM enrollments e
              WHERE e.user_id = u.id AND e.status <> 'withdrawn') AS enrollment_count
     FROM users u
     WHERE ${clause}
     ORDER BY u.created_at DESC, u.name ASC
     LIMIT ? OFFSET ?`,
    [...params, query.limit, offset],
  );
  return toPage(rows.map(mapStudent), Number(countRows[0].total), query.page, query.limit);
}

export async function getStudent(id) {
  const [rows] = await pool.query(
    `SELECT id, name, email, status, created_at
     FROM users WHERE id = ? AND role = 'student'`,
    [id],
  );
  if (!rows[0]) throw new AppError(404, 'Student not found.');

  const [enrollments] = await pool.query(
    `SELECT e.id, e.status, e.enrolled_at, c.title AS course_title,
            COALESCE(p.percent, 0) AS percent
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     LEFT JOIN progress p ON p.user_id = e.user_id AND p.course_id = e.course_id
     WHERE e.user_id = ?
     ORDER BY e.enrolled_at DESC`,
    [id],
  );

  const activeCount = enrollments.filter((row) => row.status !== 'withdrawn').length;
  return {
    ...mapStudent({ ...rows[0], enrollment_count: activeCount }),
    enrollments: enrollments.map((row) => ({
      id: row.id,
      status: row.status,
      enrolledAt: row.enrolled_at,
      courseTitle: row.course_title,
      percent: Number(row.percent),
    })),
  };
}

/** Creates a student account an administrator can hand to a learner. */
export async function createStudent(actorId, body) {
  const passwordHash = await bcrypt.hash(body.password, 10);
  try {
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES (?, ?, ?, 'student', 'active')`,
      [body.name, body.email, passwordHash],
    );
    await logActivity(pool, {
      actorId,
      action: 'student.created',
      entityType: 'user',
      entityId: result.insertId,
      details: `Added student ${body.name}`,
    });
    await notify(pool, result.insertId, {
      type: 'welcome',
      title: 'Welcome to EduAdmin Learning',
      body: 'An administrator created your account. Explore courses and start learning.',
      link: '/learn/courses',
    });
    return getStudent(result.insertId);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'That email address is already in use.', [
        { field: 'email', message: 'That email address is already in use.' },
      ]);
    }
    throw error;
  }
}

export async function updateStudent(actorId, id, body) {
  const existing = await getStudent(id);
  try {
    await pool.query(
      `UPDATE users SET name = ?, email = ?, status = ? WHERE id = ? AND role = 'student'`,
      [body.name, body.email, body.status, id],
    );
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'That email address is already in use.', [
        { field: 'email', message: 'That email address is already in use.' },
      ]);
    }
    throw error;
  }

  await logActivity(pool, {
    actorId,
    action: 'student.updated',
    entityType: 'user',
    entityId: id,
    details: `Updated ${existing.name}`,
  });
  return getStudent(id);
}

/** Permanently delete a student account. Related enrollments and progress cascade. */
export async function deleteStudent(actorId, id) {
  const existing = await getStudent(id);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      `DELETE FROM users WHERE id = ? AND role = 'student'`,
      [id],
    );
    if (!result.affectedRows) throw new AppError(404, 'Student not found.');
    await logActivity(connection, {
      actorId,
      action: 'student.deleted',
      entityType: 'user',
      entityId: id,
      details: `Deleted student ${existing.name}`,
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
