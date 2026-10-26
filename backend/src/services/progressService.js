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

/** Platform-wide lesson completions for the last 7 UTC days (admin charts). */
async function weeklyLessonActivity() {
  const [rows] = await pool.query(
    `SELECT DATE(completed_at) AS day, COUNT(*) AS lessons
     FROM lesson_progress
     WHERE completed_at >= (UTC_DATE() - INTERVAL 6 DAY)
     GROUP BY DATE(completed_at)
     ORDER BY day ASC`,
  );
  const byDay = new Map(
    rows.map((row) => {
      const key = row.day instanceof Date
        ? row.day.toISOString().slice(0, 10)
        : String(row.day).slice(0, 10);
      return [key, Number(row.lessons) || 0];
    }),
  );

  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - offset);
    const key = date.toISOString().slice(0, 10);
    days.push({
      date: key,
      day: labels[date.getUTCDay()],
      lessons: byDay.get(key) || 0,
    });
  }

  const [[prev]] = await pool.query(
    `SELECT COUNT(*) AS lessons
     FROM lesson_progress
     WHERE completed_at >= (UTC_DATE() - INTERVAL 13 DAY)
       AND completed_at < (UTC_DATE() - INTERVAL 6 DAY)`,
  );

  return {
    days,
    thisWeek: days.reduce((sum, row) => sum + row.lessons, 0),
    prevWeek: Number(prev?.lessons) || 0,
  };
}

async function progressSummary(query) {
  const { clause, params } = filters(query);
  const from = `
    FROM progress p
    JOIN users u ON u.id = p.user_id
    JOIN courses c ON c.id = p.course_id
    JOIN enrollments e ON e.user_id = p.user_id AND e.course_id = p.course_id
  `;

  const [[stats]] = await pool.query(
    `SELECT
       COUNT(*) AS tracked,
       ROUND(AVG(p.percent)) AS average_progress,
       SUM(p.status = 'not_started') AS not_started,
       SUM(p.status = 'in_progress') AS in_progress,
       SUM(p.status = 'completed') AS completed,
       SUM(p.percent < 40) AS below_forty
     ${from}
     WHERE ${clause}`,
    params,
  );

  const [byCourse] = await pool.query(
    `SELECT c.id, c.title,
            COUNT(*) AS learners,
            ROUND(AVG(p.percent)) AS average_percent
     ${from}
     WHERE ${clause}
     GROUP BY c.id, c.title
     ORDER BY average_percent DESC, learners DESC
     LIMIT 8`,
    params,
  );

  let weeklyActivity = { days: [], thisWeek: 0, prevWeek: 0 };
  try {
    weeklyActivity = await weeklyLessonActivity();
  } catch {
    // Charts degrade if lesson_progress is unavailable.
  }

  return {
    tracked: Number(stats.tracked) || 0,
    averageProgress: Number(stats.average_progress) || 0,
    notStarted: Number(stats.not_started) || 0,
    inProgress: Number(stats.in_progress) || 0,
    completed: Number(stats.completed) || 0,
    belowForty: Number(stats.below_forty) || 0,
    byCourse: byCourse.map((row) => ({
      id: row.id,
      title: row.title,
      learners: Number(row.learners) || 0,
      averagePercent: Number(row.average_percent) || 0,
    })),
    weeklyActivity,
  };
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

  const page = toPage(rows.map((row) => ({
    id: row.id,
    percent: Number(row.percent),
    status: row.status,
    updatedAt: row.updated_at,
    studentName: row.student_name,
    email: row.email,
    courseTitle: row.course_title,
    enrollmentStatus: row.enrollment_status,
  })), Number(countRows[0].total), query.page, query.limit);

  return {
    ...page,
    summary: await progressSummary(query),
  };
}
