import { pool } from '../db/pool.js';
import { likeClause, likePattern, toPage } from '../lib/sql.js';

function filters(query) {
  const where = [`e.status <> 'withdrawn'`];
  const params = [];
  if (query.q) {
    where.push(`(${likeClause('u.name')} OR ${likeClause('u.email')} OR ${likeClause('c.title')})`);
    const pattern = likePattern(query.q);
    params.push(pattern, pattern, pattern);
  }
  if (query.status) {
    where.push('p.status = ?');
    params.push(query.status);
  }
  if (query.courseId) {
    where.push('p.course_id = ?');
    params.push(query.courseId);
  }
  return { clause: where.join(' AND '), params };
}

export async function listProgress(query) {
  const { clause, params } = filters(query);
  const from = `
    FROM progress p
    JOIN users u ON u.id = p.user_id
    JOIN courses c ON c.id = p.course_id
    JOIN enrollments e ON e.user_id = p.user_id AND e.course_id = p.course_id
  `;
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total ${from} WHERE ${clause}`, params);
  const offset = (query.page - 1) * query.limit;
  const [rows] = await pool.query(
    `SELECT p.id, p.percent, p.status, p.updated_at,
            u.name AS student_name, u.email, c.title AS course_title, e.status AS enrollment_status
     ${from}
     WHERE ${clause}
     ORDER BY p.percent ASC, u.name ASC
     LIMIT ? OFFSET ?`,
    [...params, query.limit, offset],
  );

  return toPage(rows.map((row) => ({
    id: row.id,
    percent: Number(row.percent),
    status: row.status,
    updatedAt: row.updated_at,
    studentName: row.student_name,
    email: row.email,
    courseTitle: row.course_title,
    enrollmentStatus: row.enrollment_status,
  })), Number(countRows[0].total), query.page, query.limit);
}
