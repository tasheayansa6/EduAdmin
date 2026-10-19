import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { createApp } from '../src/app.js';
import { pool } from '../src/db/pool.js';

const STUDENT = { email: 'amina.yusuf@students.test', password: 'Student123!' };
const ADMIN = { email: 'super@eduadmin.test', password: 'Admin123!' };

let server;
let baseUrl;
const createdEmails = [];

async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  return { status: response.status, payload };
}

async function login(credentials) {
  return request('/api/v1/auth/login', { method: 'POST', body: credentials });
}

function registration(overrides = {}) {
  const email = overrides.email || `reg.${Date.now()}.${Math.random().toString(16).slice(2)}@students.test`;
  if (!overrides.email) createdEmails.push(email);
  return {
    name: 'Registered Student',
    password: 'Student123!',
    confirmPassword: 'Student123!',
    ...overrides,
    email,
  };
}

before(async () => {
  const app = createApp();
  server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (createdEmails.length) {
    await pool.query('DELETE FROM users WHERE email IN (?)', [createdEmails]);
  }
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

describe('Student registration', () => {
  test('creates a student account and does not accept a chosen role', async () => {
    const body = registration({ role: 'super_admin' });
    const { status, payload } = await request('/api/v1/auth/register', { method: 'POST', body });
    assert.equal(status, 201);
    assert.equal(payload.user.role, 'student');
    assert.equal(payload.user.email, body.email);
    assert.equal(payload.user.name, body.name);
    assert.equal(payload.user.password_hash, undefined);
    assert.equal(typeof payload.token, 'string');

    const [rows] = await pool.query(
      'SELECT role, password_hash FROM users WHERE email = ?',
      [body.email],
    );
    assert.equal(rows[0].role, 'student');
    assert.notEqual(rows[0].password_hash, body.password);
  });

  test('rejects a duplicate email', async () => {
    const { status, payload } = await request('/api/v1/auth/register', {
      method: 'POST',
      body: registration({ email: STUDENT.email }),
    });
    assert.equal(status, 409);
    assert.match(payload.message, /already in use/i);
  });

  test('rejects invalid registration data and weak passwords', async () => {
    const invalid = await request('/api/v1/auth/register', {
      method: 'POST',
      body: { name: 'A', email: 'not-an-email', password: 'short', confirmPassword: 'short' },
    });
    assert.equal(invalid.status, 400);
    assert.ok(invalid.payload.errors.some((item) => item.field === 'email'));
    assert.ok(invalid.payload.errors.some((item) => item.field === 'password'));

    const mismatch = await request('/api/v1/auth/register', {
      method: 'POST',
      body: registration({ confirmPassword: 'Student999!' }),
    });
    assert.equal(mismatch.status, 400);
    assert.ok(mismatch.payload.errors.some((item) => item.field === 'confirmPassword'));
  });
});

describe('Student session', () => {
  test('logs in with generic failure for a wrong password', async () => {
    const wrong = await login({ email: STUDENT.email, password: 'wrong-password' });
    assert.equal(wrong.status, 401);
    assert.equal(wrong.payload.message, 'Email or password is incorrect.');

    const unknown = await login({ email: 'nobody@students.test', password: 'Student123!' });
    assert.equal(unknown.status, 401);
    assert.equal(unknown.payload.message, wrong.payload.message);
  });

  test('logout invalidates the student token', async () => {
    const { payload } = await login(STUDENT);
    const out = await request('/api/v1/auth/logout', { method: 'POST', token: payload.token });
    assert.equal(out.status, 204);
    const me = await request('/api/v1/auth/me', { token: payload.token });
    assert.equal(me.status, 401);
  });

  test('returns only the signed-in student home', async () => {
    const { payload } = await login(STUDENT);
    const home = await request('/api/v1/student/home', { token: payload.token });
    assert.equal(home.status, 200);
    assert.equal(home.payload.data.profile.email, STUDENT.email);
    assert.equal(home.payload.data.profile.password_hash, undefined);
    assert.ok(Array.isArray(home.payload.data.enrollments));
    assert.ok(Array.isArray(home.payload.data.catalog));
    assert.equal(home.payload.data.catalog.some((course) => course.title === 'Research Methods'), false);

    const [mine] = await pool.query(
      `SELECT c.title FROM enrollments e JOIN courses c ON c.id = e.course_id JOIN users u ON u.id = e.user_id WHERE u.email = ?`,
      [STUDENT.email],
    );
    const titles = new Set(mine.map((row) => row.title));
    for (const row of home.payload.data.enrollments) {
      assert.equal(titles.has(row.courseTitle), true);
    }
  });

  test('enrolls the signed-in student in a published course and stores the row', async () => {
    const session = await login(STUDENT);
    const home = await request('/api/v1/student/home', { token: session.payload.token });
    const course = home.payload.data.catalog.find((item) => !item.enrollmentStatus);
    assert.ok(course, 'expected a published course with no enrollment');

    const enrolled = await request('/api/v1/student/enrollments', {
      method: 'POST',
      token: session.payload.token,
      body: { courseId: course.id, userId: 1 },
    });
    assert.equal(enrolled.status, 201);
    assert.equal(enrolled.payload.data.courseId, course.id);
    assert.equal(enrolled.payload.data.userId, session.payload.user.id);
    assert.equal(enrolled.payload.data.status, 'active');

    const [rows] = await pool.query(
      `SELECT e.user_id, e.status, p.percent
       FROM enrollments e
       JOIN progress p ON p.user_id = e.user_id AND p.course_id = e.course_id
       JOIN users u ON u.id = e.user_id
       WHERE u.email = ? AND e.course_id = ?`,
      [STUDENT.email, course.id],
    );
    assert.equal(rows[0].status, 'active');
    assert.equal(Number(rows[0].percent), 0);
    assert.equal(rows[0].user_id, enrolled.payload.data.userId);

    const again = await request('/api/v1/student/enrollments', {
      method: 'POST',
      token: session.payload.token,
      body: { courseId: course.id },
    });
    assert.equal(again.status, 409);

    const [drafts] = await pool.query(`SELECT id FROM courses WHERE status = 'draft' LIMIT 1`);
    const draft = await request('/api/v1/student/enrollments', {
      method: 'POST',
      token: session.payload.token,
      body: { courseId: drafts[0].id },
    });
    assert.equal(draft.status, 400);

    const admin = await login(ADMIN);
    const forbidden = await request('/api/v1/student/enrollments', {
      method: 'POST',
      token: admin.payload.token,
      body: { courseId: course.id },
    });
    assert.equal(forbidden.status, 403);

    await pool.query('DELETE FROM progress WHERE user_id = ? AND course_id = ?', [rows[0].user_id, course.id]);
    await pool.query('DELETE FROM enrollments WHERE user_id = ? AND course_id = ?', [rows[0].user_id, course.id]);
  });

  test('blocks student access to another student and to admin routes', async () => {
    const { payload } = await login(STUDENT);
    const [others] = await pool.query(
      `SELECT id FROM users WHERE role = 'student' AND email <> ? LIMIT 1`,
      [STUDENT.email],
    );
    const other = await request(`/api/v1/students/${others[0].id}`, { token: payload.token });
    assert.equal(other.status, 403);

    const dashboard = await request('/api/v1/dashboard', { token: payload.token });
    const reports = await request('/api/v1/reports', { token: payload.token });
    const admins = await request('/api/v1/administrators', {
      method: 'POST',
      token: payload.token,
      body: { name: 'Nope Admin', email: 'nope.admin@eduadmin.test', password: 'Admin123!' },
    });
    assert.equal(dashboard.status, 403);
    assert.equal(reports.status, 403);
    assert.equal(admins.status, 403);

    const admin = await login(ADMIN);
    assert.equal(admin.status, 200);
    assert.equal(admin.payload.user.role, 'super_admin');
    const portal = await request('/api/v1/student/home', { token: admin.payload.token });
    assert.equal(portal.status, 403);
  });
});
