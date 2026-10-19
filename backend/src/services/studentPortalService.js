import { pool } from '../db/pool.js';

function mapEnrollment(row) {
  return {
    id: row.id,
    status: row.status,
    enrolledAt: row.enrolled_at,
    courseTitle: row.course_title,
    courseDescription: row.course_description,
    categoryName: row.category_name,
    percent: row.percent == null ? null : Number(row.percent),
    progressStatus: row.progress_status ?? null,
  };
}

function mapCourse(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    categoryName: row.category_name,
    enrollmentStatus: row.enrollment_status ?? null,
    enrolledAt: row.enrolled_at ?? null,
    percent: row.percent == null ? null : Number(row.percent),
    progressStatus: row.progress_status ?? null,
  };
}

export async function getStudentHome(userId) {
  const [profileRows] = await pool.query(
    `SELECT id, name, email, role, status FROM users WHERE id = ? AND role = 'student'`,
    [userId],
  );
  const profile = profileRows[0];

  const [enrollmentRows] = await pool.query(
    `SELECT e.id, e.status, e.enrolled_at, c.title AS course_title, c.description AS course_description,
            cat.name AS category_name, p.percent, p.status AS progress_status
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     JOIN categories cat ON cat.id = c.category_id
     LEFT JOIN progress p ON p.user_id = e.user_id AND p.course_id = e.course_id
     WHERE e.user_id = ?
     ORDER BY e.enrolled_at DESC, c.title ASC`,
    [userId],
  );

  const [catalogRows] = await pool.query(
    `SELECT c.id, c.title, c.description, cat.name AS category_name,
            e.status AS enrollment_status, e.enrolled_at,
            p.percent, p.status AS progress_status
     FROM courses c
     JOIN categories cat ON cat.id = c.category_id
     LEFT JOIN enrollments e ON e.course_id = c.id AND e.user_id = ?
     LEFT JOIN progress p ON p.course_id = c.id AND p.user_id = ?
     WHERE c.status = 'published'
     ORDER BY c.title ASC`,
    [userId, userId],
  );

  const enrollments = enrollmentRows.map(mapEnrollment);
  const active = enrollments.filter((row) => row.status !== 'withdrawn');
  const withProgress = active.filter((row) => row.percent != null);
  const averageProgress = withProgress.length
    ? Math.round(withProgress.reduce((sum, row) => sum + row.percent, 0) / withProgress.length)
    : null;

  return {
    profile: profile
      ? {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        status: profile.status,
      }
      : null,
    summary: {
      enrollments: active.length,
      completed: enrollments.filter((row) => row.status === 'completed').length,
      averageProgress,
    },
    enrollments,
    catalog: catalogRows.map(mapCourse),
  };
}
