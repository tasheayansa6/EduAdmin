import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { createApp } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { trackNotifications } from './notificationCleanup.js';
import { cleanupUser, createCourse, createStudent } from './fixtures.js';

const ADMIN = { email: 'super@eduadmin.test', password: 'Admin123!' };
const PASSWORD = 'Learner123';
const email = `account-${Math.random().toString(16).slice(2, 10)}@students.test`;

let server;
let baseUrl;
let studentId;
let enrollmentId;
let courseId;
let catalogCourseId;
let OTHER;

async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return { status: response.status, payload: text ? JSON.parse(text) : null };
}

async function login(credentials) {
  const { payload } = await request('/api/v1/auth/login', { method: 'POST', body: credentials });
  return payload?.token;
}

const PROFILE = {
  firstName: 'Teshale',
  lastName: 'Ayansa',
  headline: 'Dairy farmer in Adama',
  biography: 'I keep twelve cows and want to improve milk yield.',
  language: 'om',
  website: 'https://example.org/farm',
  facebook: 'teshale.ayansa',
  instagram: '',
  linkedin: 'in/teshale-ayansa',
  tiktok: '@teshalefarm',
  x: 'teshale_a',
  youtube: '',
};

let cleanNotifications;

before(async () => {
  cleanNotifications = await trackNotifications(pool);
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  // Publish the catalog course before the account student exists so they only get a welcome notification.
  OTHER = await createStudent(request, { name: 'Account Other Student', password: 'Student123!' });
  const adminToken = await login(ADMIN);
  const catalogCourse = await createCourse(request, adminToken, { title: `Account Catalog ${Date.now()}`, price: 0 });
  catalogCourseId = catalogCourse.id;
  const created = await request('/api/v1/auth/register', { method: 'POST', body: { name: 'Account Test', email, password: PASSWORD, confirmPassword: PASSWORD } });
  studentId = created.payload.user.id;
});

after(async () => {
  await cleanNotifications?.();
  if (enrollmentId) await pool.query(`DELETE FROM activity_logs WHERE entity_type = 'enrollment' AND entity_id = ?`, [enrollmentId]);
  await pool.query('DELETE FROM progress WHERE user_id = ?', [studentId]);
  await pool.query('DELETE FROM enrollments WHERE user_id = ?', [studentId]);
  await pool.query('DELETE FROM cart_items WHERE user_id = ?', [studentId]);
  await pool.query('DELETE FROM favorites WHERE user_id = ?', [studentId]);
  await pool.query('DELETE FROM activity_logs WHERE actor_id = ? OR (entity_type = ? AND entity_id = ?)', [studentId, 'user', studentId]);
  await pool.query('DELETE FROM users WHERE id = ?', [studentId]);
  await cleanupUser(OTHER?.id);
  for (const id of [courseId, catalogCourseId]) {
    if (!id) continue;
    await pool.query(`DELETE FROM activity_logs WHERE entity_type = 'course' AND entity_id = ?`, [id]);
    await pool.query('DELETE FROM courses WHERE id = ?', [id]);
  }
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

describe('Student public profile', () => {
  test('starts from the account name and saves every field', async () => {
    const token = await login({ email, password: PASSWORD });
    const empty = await request('/api/v1/student/profile', { token });
    assert.equal(empty.status, 200);
    assert.equal(empty.payload.data.firstName, 'Account');
    assert.equal(empty.payload.data.lastName, 'Test');
    assert.equal(empty.payload.data.language, 'en');

    const saved = await request('/api/v1/student/profile', { method: 'PUT', token, body: PROFILE });
    assert.equal(saved.status, 200);
    assert.equal(saved.payload.data.name, 'Teshale Ayansa');
    assert.equal(saved.payload.data.tiktok, 'teshalefarm');
    assert.equal(saved.payload.data.instagram, null);
    assert.equal(saved.payload.data.linkedin, 'in/teshale-ayansa');

    const me = await request('/api/v1/auth/me', { token });
    assert.equal(me.payload.user.name, 'Teshale Ayansa');
  });

  test('rejects long headlines, links in the biography, and bad links', async () => {
    const token = await login({ email, password: PASSWORD });
    const cases = [
      [{ headline: 'x'.repeat(61) }, 'headline'],
      [{ biography: 'Visit https://spam.example now' }, 'biography'],
      [{ biography: 'see www.spam.example' }, 'biography'],
      [{ website: 'javascript:alert(1)' }, 'website'],
      [{ facebook: 'facebook.com/teshale' }, 'facebook'],
      [{ linkedin: 'https://linkedin.com/in/x' }, 'linkedin'],
      [{ language: 'xx' }, 'language'],
      [{ firstName: '' }, 'firstName'],
    ];
    for (const [change, field] of cases) {
      const result = await request('/api/v1/student/profile', { method: 'PUT', token, body: { ...PROFILE, ...change } });
      assert.equal(result.status, 400, field);
      assert.ok(result.payload.errors.some((error) => error.field === field), field);
    }
  });

  test('admins cannot use the student profile routes', async () => {
    const token = await login(ADMIN);
    assert.equal((await request('/api/v1/student/profile', { token })).status, 403);
    assert.equal((await request('/api/v1/student/notifications', { token })).status, 403);
  });
});

describe('Notifications', () => {
  test('come from real events and stay private to each student', async () => {
    const token = await login({ email, password: PASSWORD });
    const first = await request('/api/v1/student/notifications', { token });
    assert.equal(first.status, 200);
    assert.equal(first.payload.data.items[0].type, 'welcome');
    assert.equal(first.payload.data.unread, 1);

    const adminToken = await login(ADMIN);
    const home = await request('/api/v1/student/home', { token });
    const course = home.payload.data.catalog[0];
    const enrolled = await request('/api/v1/enrollments', { method: 'POST', token: adminToken, body: { userId: studentId, courseId: course.id } });
    assert.equal(enrolled.status, 201);
    enrollmentId = enrolled.payload.data.id;
    await request(`/api/v1/enrollments/${enrollmentId}`, { method: 'PATCH', token: adminToken, body: { status: 'completed' } });

    const after = await request('/api/v1/student/notifications', { token });
    const [completed, added] = after.payload.data.items;
    assert.equal(added.title, `You were enrolled in ${course.title}`);
    assert.equal(added.link, `/learn/my-courses/${course.id}/learn`);
    assert.equal(completed.title, `Your enrollment in ${course.title} is marked completed`);
    assert.equal(after.payload.data.unread, 3);

    const otherToken = await login({ email: OTHER.email, password: OTHER.password });
    const other = await request('/api/v1/student/notifications', { token: otherToken });
    assert.ok(other.payload.data.items.every((item) => item.id !== added.id));
    const foreign = await request('/api/v1/student/notifications/read', { method: 'POST', token: otherToken, body: { ids: [added.id] } });
    assert.equal(foreign.status, 200);
    assert.equal((await request('/api/v1/student/notifications', { token })).payload.data.unread, 3);

    const one = await request('/api/v1/student/notifications/read', { method: 'POST', token, body: { ids: [added.id] } });
    assert.equal(one.payload.data.unread, 2);
    const all = await request('/api/v1/student/notifications/read', { method: 'POST', token, body: {} });
    assert.equal(all.payload.data.unread, 0);
    assert.ok(all.payload.data.items.every((item) => item.read));
  });
});

describe('Courses added by an administrator', () => {
  test('stay hidden as drafts, then appear for students with a notification once published', async () => {
    const token = await login({ email, password: PASSWORD });
    const adminToken = await login(ADMIN);
    const lookups = await request('/api/v1/lookups', { token: adminToken });
    const title = `Account Course ${Date.now()}`;
    const created = await request('/api/v1/courses', {
      method: 'POST',
      token: adminToken,
      body: {
        title,
        subtitle: 'Practical field methods',
        description: 'Soil testing basics for small farms.',
        categoryId: lookups.payload.data.categories[0].id,
        status: 'draft',
        price: 250,
        currency: 'ETB',
        instructorName: 'Amina Yusuf',
        level: 'beginner',
        outcomes: ['Take a soil sample', 'Read a lab report'],
        includes: ['Video lessons', 'Field checklist'],
        outline: [{ title: 'Start here', lessons: [{ title: 'Welcome', durationMinutes: 5, type: 'lesson' }] }],
      },
    });
    assert.equal(created.status, 201);
    courseId = created.payload.data.id;
    assert.equal(created.payload.data.price, 250);
    assert.equal(created.payload.data.instructorName, 'Amina Yusuf');
    assert.deepEqual(created.payload.data.outcomes, ['Take a soil sample', 'Read a lab report']);
    assert.equal(created.payload.data.outline[0].lessons[0].title, 'Welcome');

    const hidden = await request('/api/v1/student/home', { token });
    assert.ok(hidden.payload.data.catalog.every((course) => course.id !== courseId));
    const quiet = await request('/api/v1/student/notifications', { token });
    assert.ok(quiet.payload.data.items.every((item) => item.type !== 'course'));

    await request(`/api/v1/courses/${courseId}`, { method: 'PATCH', token: adminToken, body: { status: 'published' } });
    const shown = await request('/api/v1/student/home', { token });
    const listed = shown.payload.data.catalog.find((course) => course.id === courseId);
    assert.ok(listed?.createdAt);
    assert.equal(listed.price, 250);
    assert.equal(listed.isFree, false);
    assert.equal(listed.subtitle, 'Practical field methods');
    assert.equal(listed.instructorName, 'Amina Yusuf');
    assert.equal(listed.sections[0].lessons[0].title, 'Welcome');
    const [note] = (await request('/api/v1/student/notifications', { token })).payload.data.items;
    assert.equal(note.type, 'course');
    assert.equal(note.title, `New course: ${title}`);
    assert.equal(note.link, `/learn/my-courses/${courseId}`);

    await request(`/api/v1/courses/${courseId}`, { method: 'PATCH', token: adminToken, body: { title: `${title} v2` } });
    const again = (await request('/api/v1/student/notifications', { token })).payload.data.items;
    assert.equal(again.filter((item) => item.type === 'course' && item.link === note.link).length, 1);

    const freeEnroll = await request('/api/v1/student/enrollments', { method: 'POST', token, body: { courseId } });
    assert.equal(freeEnroll.status, 402);

    const favorited = await request('/api/v1/student/favorites', { method: 'POST', token, body: { courseId } });
    assert.equal(favorited.status, 201);
    assert.ok(favorited.payload.data.some((item) => item.courseId === courseId && item.favorite));
    const carted = await request('/api/v1/student/cart', { method: 'POST', token, body: { courseId } });
    assert.equal(carted.status, 201);
    assert.equal(carted.payload.data.total, 250);
    assert.ok(carted.payload.data.items.some((item) => item.courseId === courseId && item.local));
    await request(`/api/v1/student/cart/local/${courseId}`, { method: 'DELETE', token });
    await request(`/api/v1/student/favorites/local/${courseId}`, { method: 'DELETE', token });
  });
});

describe('Local course lessons', () => {
  test('return video and PDF URLs and track completion for enrolled students', async () => {
    const token = await login({ email, password: PASSWORD });
    const adminToken = await login(ADMIN);
    const course = await createCourse(request, adminToken, {
      title: `Local Lessons ${Date.now()}`,
      price: 0,
      extra: {
        outline: [{
          title: 'Week 1',
          lessons: [
            { title: 'Welcome video', type: 'video', durationMinutes: 4, videoUrl: 'https://videos.example.org/welcome.mp4', isPreview: true },
            { title: 'Field guide', type: 'pdf', durationMinutes: 10, pdfUrl: 'https://files.example.org/guide.pdf' },
          ],
        }],
      },
    });
    const enrolled = await request('/api/v1/student/enrollments', { method: 'POST', token, body: { courseId: course.id } });
    assert.equal(enrolled.status, 201);

    const locked = await request(`/api/v1/student/learn/local/${course.id}`, { token: await login(ADMIN) });
    assert.equal(locked.status, 403);

    const open = await request(`/api/v1/student/learn/local/${course.id}`, { token });
    assert.equal(open.status, 200);
    assert.equal(open.payload.data.courseId, course.id);
    const lessons = open.payload.data.sections[0].lessons;
    assert.equal(lessons[0].videoUrl, 'https://videos.example.org/welcome.mp4');
    assert.equal(lessons[1].pdfUrl, 'https://files.example.org/guide.pdf');
    assert.equal(open.payload.data.progress.percent, 0);

    const done = await request(`/api/v1/student/learn/local/${course.id}/lessons/${lessons[0].id}`, {
      method: 'PUT',
      token,
      body: { completed: true },
    });
    assert.equal(done.status, 200);
    assert.equal(done.payload.data.progress.completedLessons, 1);
    assert.equal(done.payload.data.progress.percent, 50);

    const finished = await request(`/api/v1/student/learn/local/${course.id}/lessons/${lessons[1].id}`, {
      method: 'PUT',
      token,
      body: { completed: true },
    });
    assert.equal(finished.status, 200);
    assert.equal(finished.payload.data.progress.percent, 100);
    assert.equal(finished.payload.data.enrollmentStatus, 'completed');
  });
});

describe('Password change', () => {
  test('checks the current password, signs out old sessions, and notifies', async () => {
    const oldToken = await login({ email, password: PASSWORD });
    const wrong = await request('/api/v1/student/password', { method: 'POST', token: oldToken, body: { currentPassword: 'Nope12345', newPassword: 'NewPass456' } });
    assert.equal(wrong.status, 400);
    const weak = await request('/api/v1/student/password', { method: 'POST', token: oldToken, body: { currentPassword: PASSWORD, newPassword: 'short' } });
    assert.equal(weak.status, 400);

    const changed = await request('/api/v1/student/password', { method: 'POST', token: oldToken, body: { currentPassword: PASSWORD, newPassword: 'NewPass456' } });
    assert.equal(changed.status, 200);
    assert.equal((await request('/api/v1/auth/me', { token: oldToken })).status, 401);
    const fresh = changed.payload.data.token;
    assert.equal((await request('/api/v1/auth/me', { token: fresh })).status, 200);
    assert.equal(await login({ email, password: PASSWORD }), undefined);
    assert.equal(typeof (await login({ email, password: 'NewPass456' })), 'string');

    const list = await request('/api/v1/student/notifications', { token: fresh });
    assert.equal(list.payload.data.items[0].type, 'security');
  });
});
