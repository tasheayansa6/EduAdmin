import { pool } from '../db/pool.js';

function parseJsonList(value) {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function countOutlineLessons(outline) {
  return parseJsonList(outline).reduce(
    (sum, section) => sum + (Array.isArray(section?.lessons) ? section.lessons.length : 0),
    0,
  );
}

/** Last 7 calendar days (Mon–Sun labels) of lesson completions for charts. */
async function weeklyLessonActivity(userId) {
  const [rows] = await pool.query(
    `SELECT DATE(completed_at) AS day, COUNT(*) AS lessons
     FROM lesson_progress
     WHERE user_id = ? AND completed_at >= (UTC_DATE() - INTERVAL 6 DAY)
     GROUP BY DATE(completed_at)
     ORDER BY day ASC`,
    [userId],
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

  const [prevRows] = await pool.query(
    `SELECT COUNT(*) AS lessons
     FROM lesson_progress
     WHERE user_id = ?
       AND completed_at >= (UTC_DATE() - INTERVAL 13 DAY)
       AND completed_at < (UTC_DATE() - INTERVAL 6 DAY)`,
    [userId],
  );
  const thisWeek = days.reduce((sum, row) => sum + row.lessons, 0);
  const prevWeek = Number(prevRows[0]?.lessons) || 0;

  return { days, thisWeek, prevWeek };
}

function mapEnrollment(row) {
  const lessonsCompleted = Number(row.lessons_completed) || 0;
  const lessonsTotal = countOutlineLessons(row.outline);
  return {
    id: row.id,
    courseId: row.course_id,
    status: row.status,
    enrolledAt: row.enrolled_at,
    courseTitle: row.course_title,
    courseSlug: row.source_slug ?? null,
    courseDescription: row.course_description,
    courseImageUrl: row.image_url ?? null,
    instructorName: row.instructor_name ?? null,
    categoryName: row.category_name,
    percent: row.percent == null ? null : Number(row.percent),
    progressStatus: row.progress_status ?? null,
    lessonsCompleted,
    lessonsTotal: lessonsTotal || null,
    lastActivityAt: row.last_activity_at ?? null,
  };
}

function mapCourse(row) {
  const price = Number(row.price ?? 0);
  const parseList = parseJsonList;
  const parseOutline = (value) => {
    const sections = parseList(value);
    return sections.map((section) => ({
      title: section?.title || 'Section',
      lessons: Array.isArray(section?.lessons) ? section.lessons : [],
    }));
  };
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
    totalMinutes: row.total_minutes == null ? null : Number(row.total_minutes),
    outcomes: parseList(row.outcomes),
    requirements: parseList(row.requirements),
    // Ailg-style program detail: audience mirrors requirements until a dedicated column exists.
    audience: parseList(row.audience ?? row.requirements),
    includes: parseList(row.includes),
    process: parseList(row.process),
    modules: parseList(row.modules),
    materials: parseList(row.materials),
    sections: parseOutline(row.outline),
    status: row.status || 'published',
    isComingSoon: row.status === 'coming_soon',
    badge: row.status === 'coming_soon' ? 'Coming Soon' : (row.subtitle || null),
    categoryName: row.category_name,
    category: row.category_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    price,
    currency: row.currency || 'ETB',
    isFree: price <= 0,
    inCart: Boolean(row.in_cart),
    favorite: Boolean(row.favorite),
    enrollmentStatus: row.enrollment_status ?? null,
    enrolledAt: row.enrolled_at ?? null,
    percent: row.percent == null ? null : Number(row.percent),
    progressStatus: row.progress_status ?? null,
  };
}

/** Public Explore payload — published local courses + categories, no personal data. */
export async function getPublicExplore() {
  const [catalogRows] = await pool.query(
    `SELECT c.id, c.title, c.subtitle, c.description, c.image_url, c.preview_video_url, c.instructor_name,
            c.level, c.language, c.total_minutes, c.outcomes, c.requirements, c.includes, c.outline,
            c.status, c.created_at, c.updated_at, c.price, c.currency, cat.name AS category_name,
            NULL AS enrollment_status, NULL AS enrolled_at,
            NULL AS percent, NULL AS progress_status,
            0 AS in_cart, 0 AS favorite
     FROM courses c
     JOIN categories cat ON cat.id = c.category_id
     WHERE c.status IN ('published', 'coming_soon') AND c.source_slug IS NULL
     ORDER BY FIELD(c.status, 'published', 'coming_soon'), c.title ASC`,
  );

  const [categoryRows] = await pool.query(
    'SELECT id, name, description FROM categories ORDER BY name ASC',
  );

  return {
    profile: null,
    summary: {
      enrollments: 0,
      completed: 0,
      averageProgress: null,
      focusCategory: null,
      weeklyActivity: { days: [], thisWeek: 0, prevWeek: 0 },
    },
    categories: categoryRows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? null,
    })),
    enrollments: [],
    catalog: catalogRows.map(mapCourse),
  };
}

export async function getStudentHome(userId) {
  const [profileRows] = await pool.query(
    `SELECT id, name, email, role, status FROM users WHERE id = ? AND role = 'student'`,
    [userId],
  );
  const profile = profileRows[0];

  const [enrollmentRows] = await pool.query(
    `SELECT e.id, e.course_id, e.status, e.enrolled_at, c.title AS course_title, c.source_slug, c.description AS course_description,
            c.image_url, c.instructor_name, c.outline, cat.name AS category_name, p.percent, p.status AS progress_status,
            (SELECT COUNT(*) FROM lesson_progress lp
              WHERE lp.user_id = e.user_id AND lp.course_id = e.course_id) AS lessons_completed,
            (SELECT MAX(lp.completed_at) FROM lesson_progress lp
              WHERE lp.user_id = e.user_id AND lp.course_id = e.course_id) AS last_activity_at
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     JOIN categories cat ON cat.id = c.category_id
     LEFT JOIN progress p ON p.user_id = e.user_id AND p.course_id = e.course_id
     WHERE e.user_id = ?
     ORDER BY e.enrolled_at DESC, c.title ASC`,
    [userId],
  );

  const [catalogRows] = await pool.query(
    `SELECT c.id, c.title, c.subtitle, c.description, c.image_url, c.preview_video_url, c.instructor_name,
            c.level, c.language, c.total_minutes, c.outcomes, c.requirements, c.includes, c.outline,
            c.status, c.created_at, c.updated_at, c.price, c.currency, cat.name AS category_name,
            e.status AS enrollment_status, e.enrolled_at,
            p.percent, p.status AS progress_status,
            EXISTS (SELECT 1 FROM cart_items ci WHERE ci.user_id = ? AND ci.course_id = c.id) AS in_cart,
            EXISTS (SELECT 1 FROM favorites f WHERE f.user_id = ? AND f.course_id = c.id) AS favorite
     FROM courses c
     JOIN categories cat ON cat.id = c.category_id
     LEFT JOIN enrollments e ON e.course_id = c.id AND e.user_id = ?
     LEFT JOIN progress p ON p.course_id = c.id AND p.user_id = ?
     WHERE c.status IN ('published', 'coming_soon') AND c.source_slug IS NULL
     ORDER BY FIELD(c.status, 'published', 'coming_soon'), c.title ASC`,
    [userId, userId, userId, userId],
  );

  const enrollments = enrollmentRows.map(mapEnrollment);
  const active = enrollments.filter((row) => row.status !== 'withdrawn');
  const withProgress = active.filter((row) => row.percent != null);
  const averageProgress = withProgress.length
    ? Math.round(withProgress.reduce((sum, row) => sum + row.percent, 0) / withProgress.length)
    : null;

  const categoryCounts = new Map();
  for (const row of active) {
    if (!row.categoryName) continue;
    categoryCounts.set(row.categoryName, (categoryCounts.get(row.categoryName) || 0) + 1);
  }
  const focusCategory = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0]
    ?? null;

  const [categoryRows] = await pool.query(
    'SELECT id, name, description FROM categories ORDER BY name ASC',
  );

  const weeklyActivity = await weeklyLessonActivity(userId);

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
      focusCategory,
      weeklyActivity,
    },
    categories: categoryRows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? null,
    })),
    enrollments,
    catalog: catalogRows.map(mapCourse),
  };
}
