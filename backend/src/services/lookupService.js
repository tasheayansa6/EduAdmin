import { pool } from '../db/pool.js';

export async function getLookups() {
  const [students] = await pool.query(
    `SELECT id, name, email
     FROM users
     WHERE role = 'student' AND status = 'active'
     ORDER BY name ASC
     LIMIT 500`,
  );
  const [courses] = await pool.query(
    `SELECT id, title, status FROM courses ORDER BY title ASC LIMIT 500`,
  );
  const [categories] = await pool.query(
    'SELECT id, name FROM categories ORDER BY name ASC',
  );

  return {
    students: students.map((row) => ({ id: row.id, name: row.name, email: row.email })),
    courses: courses.map((row) => ({ id: row.id, title: row.title, status: row.status })),
    categories: categories.map((row) => ({ id: row.id, name: row.name })),
  };
}
