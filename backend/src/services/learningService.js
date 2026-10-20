import { pool } from '../db/pool.js';
import { getCourseContent } from '../lib/ailgCatalog.js';
import { AppError } from '../lib/errors.js';
import { notify } from '../lib/notify.js';

async function enrolledCourse(executor, userId, slug, lock = false) {
  const [rows] = await executor.query(
    `SELECT c.id AS course_id, e.id AS enrollment_id, e.status
     FROM courses c JOIN enrollments e ON e.course_id = c.id AND e.user_id = ?
     WHERE c.source_slug = ? AND e.status <> 'withdrawn'${lock ? ' FOR UPDATE' : ''}`,
    [userId, slug],
  );
  if (!rows[0]) throw new AppError(403, 'Enroll in this course to open its lessons.');
  return rows[0];
}

async function requireContent(slug) {
  const content = await getCourseContent(slug);
  if (!content) throw new AppError(404, 'This course is not available.');
  return content;
}

const lessonIds = (content) => content.sections.flatMap((section) => section.lessons.map((lesson) => lesson.id));

async function completedIds(executor, userId, courseId) {
  const [rows] = await executor.query('SELECT lesson_id FROM lesson_progress WHERE user_id = ? AND course_id = ?', [userId, courseId]);
  return new Set(rows.map((row) => row.lesson_id));
}

function summary(ids, done) {
  const completed = ids.filter((id) => done.has(id)).length;
  const percent = ids.length ? Math.round((completed / ids.length) * 100) : 0;
  const status = percent >= 100 ? 'completed' : completed ? 'in_progress' : 'not_started';
  return { completedLessons: completed, totalLessons: ids.length, percent, status };
}

/** The full lesson list for an enrolled student, with what they have ticked off. */
export async function getLearning(userId, slug) {
  const course = await enrolledCourse(pool, userId, slug);
  const content = await requireContent(slug);
  const done = await completedIds(pool, userId, course.course_id);
  return {
    slug: content.slug,
    title: content.title,
    enrollmentStatus: course.status,
    progress: summary(lessonIds(content), done),
    sections: content.sections.map((section) => ({
      id: section.id,
      title: section.title,
      lessons: section.lessons.map((lesson) => ({ ...lesson, completed: done.has(lesson.id) })),
    })),
  };
}

/**
 * Ticks or unticks one lesson and recalculates the course percent from the lessons ticked.
 * Reaching 100% marks the enrollment completed; dropping below reopens it.
 */
export async function setLessonCompleted(userId, slug, lessonId, completed) {
  const content = await requireContent(slug);
  const ids = lessonIds(content);
  if (!ids.includes(lessonId)) throw new AppError(404, 'Lesson not found in this course.');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const course = await enrolledCourse(connection, userId, slug, true);
    if (completed) {
      await connection.query('INSERT IGNORE INTO lesson_progress (user_id, course_id, lesson_id) VALUES (?, ?, ?)', [userId, course.course_id, lessonId]);
    } else {
      await connection.query('DELETE FROM lesson_progress WHERE user_id = ? AND course_id = ? AND lesson_id = ?', [userId, course.course_id, lessonId]);
    }
    const progress = summary(ids, await completedIds(connection, userId, course.course_id));
    await connection.query(
      `INSERT INTO progress (user_id, course_id, percent, status) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE percent = VALUES(percent), status = VALUES(status)`,
      [userId, course.course_id, progress.percent, progress.status],
    );
    let enrollmentStatus = course.status;
    if (progress.status === 'completed' && course.status === 'active') enrollmentStatus = 'completed';
    if (progress.status !== 'completed' && course.status === 'completed') enrollmentStatus = 'active';
    if (enrollmentStatus !== course.status) {
      await connection.query('UPDATE enrollments SET status = ? WHERE id = ?', [enrollmentStatus, course.enrollment_id]);
      if (enrollmentStatus === 'completed') {
        await notify(connection, userId, {
          type: 'completion',
          title: `You completed ${content.title}`,
          body: `All ${ids.length} lesson${ids.length === 1 ? '' : 's'} are done. Well done!`,
          link: `/learn/courses/${slug}/learn`,
        });
      }
    }
    await connection.commit();
    return { lessonId, completed, enrollmentStatus, progress };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
