import { pool } from '../src/db/pool.js';

/** Creates a temporary student for a test file. Caller must delete via cleanupUser. */
export async function createStudent(request, overrides = {}) {
  const email = overrides.email || `fixture-${Math.random().toString(16).slice(2, 10)}@students.test`;
  const password = overrides.password || 'Student123!';
  const name = overrides.name || 'Fixture Student';
  const created = await request('/api/v1/auth/register', {
    method: 'POST',
    body: { name, email, password, confirmPassword: password },
  });
  if (created.status !== 201) {
    throw new Error(`Could not create fixture student (${created.status}): ${JSON.stringify(created.payload)}`);
  }
  return { id: created.payload.user.id, email, password, name, token: created.payload.token };
}

/** Creates a published local course as the given admin token. */
export async function createCourse(request, adminToken, overrides = {}) {
  const lookups = await request('/api/v1/lookups', { token: adminToken });
  const categoryId = overrides.categoryId || lookups.payload.data.categories[0]?.id;
  if (!categoryId) throw new Error('No categories available for fixture course.');
  const body = {
    title: overrides.title || `Fixture Course ${Date.now()}`,
    description: overrides.description || 'Fixture course created for automated tests only.',
    categoryId,
    status: overrides.status || 'published',
    price: overrides.price ?? 0,
    currency: overrides.currency || 'ETB',
    ...overrides.extra,
  };
  const created = await request('/api/v1/courses', { method: 'POST', token: adminToken, body });
  if (created.status !== 201) {
    throw new Error(`Could not create fixture course (${created.status}): ${JSON.stringify(created.payload)}`);
  }
  return created.payload.data;
}

export async function cleanupUser(userId) {
  if (!userId) return;
  await pool.query('DELETE FROM lesson_progress WHERE user_id = ?', [userId]);
  await pool.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
  await pool.query('DELETE FROM favorites WHERE user_id = ?', [userId]);
  await pool.query(
    `DELETE oi FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.user_id = ?`,
    [userId],
  );
  await pool.query('DELETE FROM orders WHERE user_id = ?', [userId]);
  await pool.query('DELETE FROM progress WHERE user_id = ?', [userId]);
  const [enrollments] = await pool.query('SELECT id FROM enrollments WHERE user_id = ?', [userId]);
  if (enrollments.length) {
    await pool.query(`DELETE FROM activity_logs WHERE entity_type = 'enrollment' AND entity_id IN (?)`, [
      enrollments.map((row) => row.id),
    ]);
  }
  await pool.query('DELETE FROM enrollments WHERE user_id = ?', [userId]);
  await pool.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
  await pool.query('DELETE FROM activity_logs WHERE actor_id = ? OR (entity_type = ? AND entity_id = ?)', [
    userId,
    'user',
    userId,
  ]);
  await pool.query('DELETE FROM users WHERE id = ?', [userId]);
}

export async function cleanupCourse(courseId) {
  if (!courseId) return;
  await pool.query('DELETE FROM lesson_progress WHERE course_id = ?', [courseId]);
  await pool.query('DELETE FROM cart_items WHERE course_id = ?', [courseId]);
  await pool.query('DELETE FROM favorites WHERE course_id = ?', [courseId]);
  await pool.query('DELETE FROM order_items WHERE course_id = ?', [courseId]);
  await pool.query('DELETE FROM progress WHERE course_id = ?', [courseId]);
  await pool.query('DELETE FROM enrollments WHERE course_id = ?', [courseId]);
  await pool.query(`DELETE FROM activity_logs WHERE entity_type = 'course' AND entity_id = ?`, [courseId]);
  await pool.query('DELETE FROM courses WHERE id = ?', [courseId]);
}

export async function cleanupEnrollment(enrollmentId) {
  if (!enrollmentId) return;
  await pool.query(`DELETE FROM activity_logs WHERE entity_type = 'enrollment' AND entity_id = ?`, [enrollmentId]);
}
