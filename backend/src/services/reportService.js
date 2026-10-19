import { pool } from '../db/pool.js';
import { AppError } from '../lib/errors.js';

function monthKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function monthsBetween(from, to) {
  const start = from
    ? new Date(`${from}T00:00:00.000Z`)
    : new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 5, 1));
  const end = to
    ? new Date(`${to}T00:00:00.000Z`)
    : new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));

  const months = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  while (cursor <= last) {
    months.push(monthKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

/**
 * Enrollment date filter: from is inclusive (>= date 00:00 UTC),
 * to is inclusive through end of that calendar day (< date + 1 day).
 * Withdrawn enrollments are excluded from enrollment/progress metrics.
 */
function enrollmentDateClause(alias = 'e') {
  return `
    (? IS NULL OR ${alias}.enrolled_at >= ?)
    AND (? IS NULL OR ${alias}.enrolled_at < DATE_ADD(?, INTERVAL 1 DAY))
  `;
}

export async function getReport(query) {
  const from = query.from || null;
  const to = query.to || null;
  const courseId = query.courseId || null;

  if (from && to && from > to) {
    throw new AppError(400, 'The start date must be on or before the end date.');
  }

  const dateParams = [from, from, to, to];

  const [[students]] = await pool.query(
    `SELECT
       COUNT(*) AS total,
       SUM(status = 'active') AS active,
       SUM(status = 'inactive') AS inactive,
       SUM(status = 'suspended') AS suspended
     FROM users WHERE role = 'student'`,
  );

  const [[catalog]] = await pool.query(
    `SELECT
       COUNT(*) AS courses,
       SUM(status = 'published') AS published,
       SUM(status = 'draft') AS draft
     FROM courses`,
  );

  const [[enrollmentStats]] = await pool.query(
    `SELECT
       COUNT(*) AS total,
       SUM(status = 'active') AS active,
       SUM(status = 'completed') AS completed,
       SUM(status = 'withdrawn') AS withdrawn
     FROM enrollments e
     WHERE ${enrollmentDateClause('e')}
       AND (? IS NULL OR e.course_id = ?)`,
    [...dateParams, courseId, courseId],
  );

  const [[progressStats]] = await pool.query(
    `SELECT
       COUNT(*) AS tracked,
       ROUND(AVG(p.percent)) AS average_progress,
       SUM(p.status = 'completed') AS completed_progress,
       SUM(p.percent < 40) AS below_forty
     FROM progress p
     JOIN enrollments e ON e.user_id = p.user_id AND e.course_id = p.course_id
     WHERE e.status <> 'withdrawn'
       AND ${enrollmentDateClause('e')}
       AND (? IS NULL OR e.course_id = ?)`,
    [...dateParams, courseId, courseId],
  );

  const [courses] = await pool.query(
    `SELECT c.id, c.title, c.status AS course_status, cat.name AS category,
            COUNT(e.id) AS enrollments,
            SUM(e.status = 'completed') AS completed,
            ROUND(AVG(CASE WHEN e.id IS NOT NULL THEN p.percent END)) AS average_progress
     FROM courses c
     JOIN categories cat ON cat.id = c.category_id
     LEFT JOIN enrollments e
       ON e.course_id = c.id
      AND e.status <> 'withdrawn'
      AND ${enrollmentDateClause('e')}
     LEFT JOIN progress p ON p.user_id = e.user_id AND p.course_id = e.course_id
     WHERE (? IS NULL OR c.id = ?)
     GROUP BY c.id, c.title, c.status, cat.name
     ORDER BY enrollments DESC, c.title ASC`,
    [...dateParams, courseId, courseId],
  );

  const courseRows = courses.map((row) => {
    const enrollments = Number(row.enrollments);
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      courseStatus: row.course_status,
      enrollments,
      completed: Number(row.completed ?? 0),
      averageProgress: enrollments > 0 ? Number(row.average_progress ?? 0) : null,
    };
  });

  const enrollmentTotal = Number(enrollmentStats.total ?? 0);
  const completedInRange = Number(enrollmentStats.completed ?? 0);
  const nonWithdrawnInRange = Number(enrollmentStats.active ?? 0) + completedInRange;

  const months = monthsBetween(from, to);

  const [enrollmentTrendRows] = await pool.query(
    `SELECT DATE_FORMAT(enrolled_at, '%Y-%m') AS month, COUNT(*) AS count
     FROM enrollments e
     WHERE e.status <> 'withdrawn'
       AND ${enrollmentDateClause('e')}
       AND (? IS NULL OR e.course_id = ?)
     GROUP BY month
     ORDER BY month`,
    [...dateParams, courseId, courseId],
  );
  const enrollmentTrendMap = new Map(
    enrollmentTrendRows.map((row) => [row.month, Number(row.count)]),
  );

  const [registrationTrendRows] = await pool.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
     FROM users
     WHERE role = 'student'
       AND (? IS NULL OR created_at >= ?)
       AND (? IS NULL OR created_at < DATE_ADD(?, INTERVAL 1 DAY))
     GROUP BY month
     ORDER BY month`,
    dateParams,
  );
  const registrationTrendMap = new Map(
    registrationTrendRows.map((row) => [row.month, Number(row.count)]),
  );

  return {
    from,
    to,
    courseId,
    period: {
      fromInclusive: Boolean(from),
      toInclusive: Boolean(to),
      timezone: 'UTC',
      enrollmentRule: 'withdrawn_excluded_from_course_and_progress_metrics',
    },
    students: {
      total: Number(students.total),
      active: Number(students.active ?? 0),
      inactive: Number(students.inactive ?? 0),
      suspended: Number(students.suspended ?? 0),
    },
    courses: Number(catalog.courses),
    publishedCourses: Number(catalog.published ?? 0),
    draftCourses: Number(catalog.draft ?? 0),
    enrollments: nonWithdrawnInRange,
    enrollmentsByStatus: {
      active: Number(enrollmentStats.active ?? 0),
      completed: completedInRange,
      withdrawn: Number(enrollmentStats.withdrawn ?? 0),
      allInRange: enrollmentTotal,
    },
    completionRate: nonWithdrawnInRange
      ? Math.round((completedInRange / nonWithdrawnInRange) * 100)
      : 0,
    progress: {
      tracked: Number(progressStats.tracked ?? 0),
      averageProgress: Number(progressStats.average_progress ?? 0),
      completed: Number(progressStats.completed_progress ?? 0),
      belowForty: Number(progressStats.below_forty ?? 0),
    },
    enrollmentTrend: months.map((month) => ({
      month,
      count: enrollmentTrendMap.get(month) ?? 0,
    })),
    studentRegistrationTrend: months.map((month) => ({
      month,
      count: registrationTrendMap.get(month) ?? 0,
    })),
    courseRows,
    lowEnrollmentCourses: courseRows
      .filter((row) => row.courseStatus === 'published' && row.enrollments === 0)
      .slice(0, 10),
    topCourses: courseRows.filter((row) => row.enrollments > 0).slice(0, 8),
  };
}

export function reportToCsv(report) {
  const lines = [
    ['Course', 'Category', 'Status', 'Enrollments', 'Completed', 'Average progress %'].join(','),
  ];
  for (const row of report.courseRows) {
    const cells = [
      row.title,
      row.category,
      row.courseStatus,
      row.enrollments,
      row.completed,
      row.averageProgress == null ? '' : row.averageProgress,
    ].map(csvEscape);
    lines.push(cells.join(','));
  }
  return `${lines.join('\n')}\n`;
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}
