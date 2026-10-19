import { pool } from '../db/pool.js';

function monthKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function recentMonths(count = 6) {
  const now = new Date();
  const months = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    months.push(monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1))));
  }
  return months;
}

export async function getDashboard() {
  const [[totals]] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM users WHERE role = 'student') AS students,
       (SELECT COUNT(*) FROM courses) AS courses,
       (SELECT COUNT(*) FROM courses WHERE status = 'published') AS published_courses,
       (SELECT COUNT(*) FROM courses WHERE status = 'draft') AS draft_courses,
       (SELECT COUNT(*) FROM enrollments WHERE status <> 'withdrawn') AS enrollments,
       (SELECT ROUND(AVG(p.percent))
          FROM progress p
          JOIN enrollments e ON e.user_id = p.user_id AND e.course_id = p.course_id
         WHERE e.status <> 'withdrawn') AS average_progress`,
  );

  const [trendRows] = await pool.query(
    `SELECT DATE_FORMAT(enrolled_at, '%Y-%m') AS month, COUNT(*) AS count
     FROM enrollments
     WHERE status <> 'withdrawn'
       AND enrolled_at >= DATE_FORMAT(DATE_SUB(UTC_TIMESTAMP(), INTERVAL 5 MONTH), '%Y-%m-01')
     GROUP BY month
     ORDER BY month`,
  );
  const trendMap = new Map(trendRows.map((row) => [row.month, Number(row.count)]));

  const [activity] = await pool.query(
    `SELECT a.id, a.action, a.details, a.created_at, u.name AS actor_name
     FROM activity_logs a
     LEFT JOIN users u ON u.id = a.actor_id
     ORDER BY a.created_at DESC
     LIMIT 8`,
  );

  const [attention] = await pool.query(
    `SELECT u.name AS student_name, c.title AS course_title, p.percent
     FROM progress p
     JOIN users u ON u.id = p.user_id
     JOIN courses c ON c.id = p.course_id
     JOIN enrollments e ON e.user_id = p.user_id AND e.course_id = p.course_id
     WHERE e.status = 'active' AND p.percent < 40
     ORDER BY p.percent ASC, u.name ASC
     LIMIT 5`,
  );

  return {
    students: Number(totals.students),
    courses: Number(totals.courses),
    publishedCourses: Number(totals.published_courses),
    draftCourses: Number(totals.draft_courses),
    enrollments: Number(totals.enrollments),
    averageProgress: Number(totals.average_progress ?? 0),
    enrollmentTrend: recentMonths().map((month) => ({
      month,
      count: trendMap.get(month) ?? 0,
    })),
    recentActivity: activity.map((row) => ({
      id: row.id,
      action: row.action,
      details: row.details,
      createdAt: row.created_at,
      actorName: row.actor_name,
    })),
    attention: attention.map((row) => ({
      studentName: row.student_name,
      courseTitle: row.course_title,
      percent: Number(row.percent),
    })),
  };
}
