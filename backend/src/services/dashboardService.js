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
    `SELECT u.name AS student_name, c.title AS course_title, p.percent, u.id AS student_id
     FROM progress p
     JOIN users u ON u.id = p.user_id
     JOIN courses c ON c.id = p.course_id
     JOIN enrollments e ON e.user_id = p.user_id AND e.course_id = p.course_id
     WHERE e.status = 'active' AND p.percent < 40
     ORDER BY p.percent ASC, u.name ASC
     LIMIT 5`,
  );

  const [roster] = await pool.query(
    `SELECT u.id, u.name, u.email, u.status,
            (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id AND e.status <> 'withdrawn') AS course_count
     FROM users u
     WHERE u.role = 'student'
     ORDER BY u.created_at DESC
     LIMIT 8`,
  );

  const [[staff]] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM users WHERE role IN ('admin', 'super_admin') AND status = 'active') AS admins,
       (SELECT COUNT(DISTINCT NULLIF(TRIM(instructor_name), '')) FROM courses WHERE instructor_name IS NOT NULL AND instructor_name <> '') AS instructors`,
  );

  return {
    students: Number(totals.students),
    courses: Number(totals.courses),
    publishedCourses: Number(totals.published_courses),
    draftCourses: Number(totals.draft_courses),
    enrollments: Number(totals.enrollments),
    averageProgress: Number(totals.average_progress ?? 0),
    activeAdmins: Number(staff.admins),
    instructors: Number(staff.instructors),
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
      studentId: row.student_id,
      studentName: row.student_name,
      courseTitle: row.course_title,
      percent: Number(row.percent),
    })),
    roster: roster.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      status: row.status,
      courseCount: Number(row.course_count),
      needsReview: row.status !== 'active',
    })),
  };
}

const ADMIN_FEED_ACTIONS = [
  'enrollment.created',
  'enrollment.updated',
  'enrollment.deleted',
  'student.created',
  'course.published',
  'course.created',
  'career.application_received',
  'contact.message_received',
  'membership.request_received',
  'subscription.campaign_sent',
];

function adminNotificationLink(action) {
  if (action.startsWith('enrollment.')) return '/enrollments';
  if (action.startsWith('student.')) return '/students';
  if (action.startsWith('course.')) return '/courses';
  if (action.startsWith('career.')) return '/careers';
  if (action.startsWith('contact.')) return '/contact';
  if (action.startsWith('membership.')) return '/membership';
  if (action.startsWith('subscription.')) return '/subscriptions';
  if (action.startsWith('blog.')) return '/blogs';
  return '/reports';
}

/** Recent operational events for the admin header bell (enrollments first). */
export async function getAdminNotifications(limit = 20) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const placeholders = ADMIN_FEED_ACTIONS.map(() => '?').join(', ');
  const [rows] = await pool.query(
    `SELECT a.id, a.action, a.details, a.created_at, u.name AS actor_name
     FROM activity_logs a
     LEFT JOIN users u ON u.id = a.actor_id
     WHERE a.action IN (${placeholders})
     ORDER BY a.created_at DESC, a.id DESC
     LIMIT ?`,
    [...ADMIN_FEED_ACTIONS, safeLimit],
  );

  const [[counts]] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM enrollments WHERE status = 'active'
          AND enrolled_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)) AS new_enrollments,
       (SELECT COUNT(*) FROM contact_messages WHERE status = 'new') AS new_messages,
       (SELECT COUNT(*) FROM career_applications WHERE status = 'new') AS new_applications,
       (SELECT COUNT(*) FROM membership_requests WHERE status = 'new') AS new_membership_requests`,
  );

  return {
    items: rows.map((row) => ({
      id: row.id,
      action: row.action,
      details: row.details,
      createdAt: row.created_at,
      actorName: row.actor_name,
      link: adminNotificationLink(row.action),
    })),
    summary: {
      newEnrollments: Number(counts.new_enrollments),
      newMessages: Number(counts.new_messages),
      newApplications: Number(counts.new_applications),
      newMembershipRequests: Number(counts.new_membership_requests),
    },
  };
}
