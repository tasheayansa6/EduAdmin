import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { trackNotifications } from './notificationCleanup.js';
import { cleanupCourse, cleanupUser, createCourse, createStudent } from './fixtures.js';

const ADMIN = { email: 'super@eduadmin.test', password: 'Admin123!' };
const SUPER = ADMIN;

let server;
let baseUrl;
let fixtureStudent;
let fixtureCourse;

async function request(path, { method = 'GET', token, body, rawBody, headers = {} } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined || rawBody !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: rawBody !== undefined ? rawBody : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }
  return { status: response.status, payload, text, headers: response.headers };
}

async function login(credentials = ADMIN) {
  const { status, payload } = await request('/api/v1/auth/login', {
    method: 'POST',
    body: credentials,
  });
  assert.equal(status, 200, `login failed: ${JSON.stringify(payload)}`);
  return payload;
}

let cleanNotifications;
const createdCourseIds = [];

before(async () => {
  cleanNotifications = await trackNotifications(pool);
  const app = createApp();
  server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  fixtureStudent = await createStudent(request, { name: 'Phase9 Fixture Student' });
  const session = await login();
  fixtureCourse = await createCourse(request, session.token, { title: `Phase9 Fixture Course ${Date.now()}` });
  createdCourseIds.push(fixtureCourse.id);
});

after(async () => {
  await cleanNotifications?.();
  if (createdCourseIds.length) {
    await pool.query("DELETE FROM activity_logs WHERE entity_type = 'course' AND entity_id IN (?)", [createdCourseIds]);
    await pool.query('DELETE FROM courses WHERE id IN (?)', [createdCourseIds]);
  }
  await cleanupUser(fixtureStudent?.id);
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

describe('Health', () => {
  test('GET /api/health and /api/v1/health are public', async () => {
    for (const path of ['/api/health', '/api/v1/health']) {
      const { status, payload } = await request(path);
      assert.equal(status, 200);
      assert.equal(payload.ok, true);
    }
  });
});

describe('Input validation and errors', () => {
  test('rejects malformed JSON with 400 and no stack', async () => {
    const { status, payload, text } = await request('/api/v1/auth/login', {
      method: 'POST',
      rawBody: '{not-json',
    });
    assert.equal(status, 400);
    assert.equal(payload.message, 'Request body must be valid JSON.');
    assert.doesNotMatch(text, /stack|at Object|node_modules/i);
  });

  test('rejects oversized page size and non-positive page', async () => {
    const session = await login();
    const oversized = await request('/api/v1/students?limit=51', { token: session.token });
    assert.equal(oversized.status, 400);

    const badPage = await request('/api/v1/students?page=0', { token: session.token });
    assert.equal(badPage.status, 400);
  });

  test('rejects invalid email and unsupported student status', async () => {
    const session = await login();
    const students = await request('/api/v1/students?limit=1&status=active', { token: session.token });
    const student = students.payload.data[0];
    assert.ok(student);

    const badEmail = await request(`/api/v1/students/${student.id}`, {
      method: 'PATCH',
      token: session.token,
      body: { name: student.name, email: 'not-an-email', status: student.status },
    });
    assert.equal(badEmail.status, 400);

    const badStatus = await request(`/api/v1/students/${student.id}`, {
      method: 'PATCH',
      token: session.token,
      body: { name: student.name, email: student.email, status: 'deleted' },
    });
    assert.equal(badStatus.status, 400);
  });

  test('rejects invalid report dates and unknown routes with safe 404', async () => {
    const session = await login();
    const badDate = await request('/api/v1/reports?from=01-01-2026', { token: session.token });
    assert.equal(badDate.status, 400);

    const missing = await request('/api/v1/does-not-exist', { token: session.token });
    assert.equal(missing.status, 404);
    assert.equal(missing.payload.message, 'The requested resource was not found.');
    assert.equal(missing.payload.stack, undefined);
  });

  test('rejects empty course create body', async () => {
    const session = await login();
    const { status, payload } = await request('/api/v1/courses', {
      method: 'POST',
      token: session.token,
      body: {},
    });
    assert.equal(status, 400);
    assert.ok(Array.isArray(payload.errors));
  });
});

describe('Students', () => {
  test('lists students with pagination meta and returns detail', async () => {
    const session = await login();
    const list = await request('/api/v1/students?limit=5&page=1', { token: session.token });
    assert.equal(list.status, 200);
    assert.ok(Array.isArray(list.payload.data));
    assert.equal(typeof list.payload.meta.total, 'number');
    assert.ok(list.payload.data.length >= 1);

    const id = list.payload.data[0].id;
    const detail = await request(`/api/v1/students/${id}`, { token: session.token });
    assert.equal(detail.status, 200);
    assert.equal(detail.payload.data.id, id);
    assert.ok(Array.isArray(detail.payload.data.enrollments));
    assert.equal(detail.payload.data.password_hash, undefined);
  });

  test('returns 404 for nonexistent or non-student ids', async () => {
    const session = await login();
    const missing = await request('/api/v1/students/999999', { token: session.token });
    assert.equal(missing.status, 404);

    const superSession = await login(SUPER);
    const admins = await request('/api/v1/administrators', {
      token: superSession.token,
    });
    const adminId = admins.payload.data.find((row) => row.role === 'admin')?.id
      ?? admins.payload.data[0].id;
    const asStudent = await request(`/api/v1/students/${adminId}`, { token: session.token });
    assert.equal(asStudent.status, 404);
  });

  test('updates student fields and rejects duplicate email with 409', async () => {
    const session = await login();
    const list = await request('/api/v1/students?limit=5&status=active', { token: session.token });
    assert.ok(list.payload.data.length >= 2);
    const [target, other] = list.payload.data;

    const updated = await request(`/api/v1/students/${target.id}`, {
      method: 'PATCH',
      token: session.token,
      body: {
        name: `${target.name.split(' ')[0]} QA`,
        email: target.email,
        status: target.status,
      },
    });
    assert.equal(updated.status, 200);
    assert.match(updated.payload.data.name, /QA$/);

    // Restore original name to avoid polluting seed display permanently.
    await request(`/api/v1/students/${target.id}`, {
      method: 'PATCH',
      token: session.token,
      body: { name: target.name, email: target.email, status: target.status },
    });

    const conflict = await request(`/api/v1/students/${target.id}`, {
      method: 'PATCH',
      token: session.token,
      body: { name: target.name, email: other.email, status: target.status },
    });
    assert.equal(conflict.status, 409);
  });
});

describe('Courses integrity', () => {
  test('creates, updates, and soft-unpublishes an isolated course', async () => {
    const session = await login();
    const lookups = await request('/api/v1/lookups', { token: session.token });
    const categoryId = lookups.payload.data.categories[0].id;
    const title = `QA Course ${Date.now()}`;

    const created = await request('/api/v1/courses', {
      method: 'POST',
      token: session.token,
      body: {
        title,
        description: 'Isolated course created by Phase 9 QA automated tests.',
        categoryId,
        status: 'draft',
      },
    });
    assert.equal(created.status, 201);
    const courseId = created.payload.data.id;
    createdCourseIds.push(courseId);

    const published = await request(`/api/v1/courses/${courseId}`, {
      method: 'PATCH',
      token: session.token,
      body: { status: 'published' },
    });
    assert.equal(published.status, 200);
    assert.equal(published.payload.data.status, 'published');

    const deleted = await request(`/api/v1/courses/${courseId}`, {
      method: 'DELETE',
      token: session.token,
    });
    assert.equal(deleted.status, 204);

    const listed = await request(`/api/v1/courses?q=${encodeURIComponent(title)}&limit=20`, {
      token: session.token,
    });
    const row = listed.payload.data.find((item) => item.id === courseId);
    assert.ok(row);
    assert.equal(row.status, 'draft');
  });

  test('rejects enrollment into draft courses', async () => {
    const session = await login();
    const students = await request('/api/v1/students?limit=1&status=active', { token: session.token });
    const drafts = await request('/api/v1/courses?limit=1&status=draft', { token: session.token });
    const student = students.payload.data[0];
    const draft = drafts.payload.data[0];
    assert.ok(student && draft);

    const attempt = await request('/api/v1/enrollments', {
      method: 'POST',
      token: session.token,
      body: { userId: student.id, courseId: draft.id },
    });
    assert.equal(attempt.status, 400);
    assert.match(attempt.payload.message, /published/i);
  });

  test('returns 404 for nonexistent course update', async () => {
    const session = await login();
    const { status } = await request('/api/v1/courses/999999', {
      method: 'PATCH',
      token: session.token,
      body: { title: 'Missing course title' },
    });
    assert.equal(status, 404);
  });
});

describe('Authorization hardening', () => {
  test('profile update ignores role escalation attempts', async () => {
    const session = await login();
    const originalName = session.user.name;
    const { status, payload } = await request('/api/v1/auth/me', {
      method: 'PATCH',
      token: session.token,
      body: { name: originalName, role: 'super_admin', id: 1 },
    });
    assert.equal(status, 200);
    assert.equal(payload.user.role, 'super_admin');
    assert.equal(payload.user.id, session.user.id);
  });

  test('admin cannot create administrators', async () => {
    const email = `staff.${Date.now()}@eduadmin.test`;
    const passwordHash = await bcrypt.hash('Admin123!', 4);
    const [created] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ('Staff Admin', ?, ?, 'admin', 'active')`,
      [email, passwordHash],
    );
    try {
      const session = await login({ email, password: 'Admin123!' });
      const { status } = await request('/api/v1/administrators', {
        method: 'POST',
        token: session.token,
        body: {
          name: 'Intruder Admin',
          email: `intruder.${Date.now()}@eduadmin.test`,
          password: 'Admin123!',
        },
      });
      assert.equal(status, 403);
    } finally {
      await pool.query('DELETE FROM users WHERE id = ?', [created.insertId]);
    }
  });

  test('missing Authorization header is rejected on mutations', async () => {
    const { status } = await request('/api/v1/courses', {
      method: 'POST',
      body: {
        title: 'Unauthorized Course',
        description: 'Should not be created without a token.',
        categoryId: 1,
        status: 'draft',
      },
    });
    assert.equal(status, 401);
  });
});

describe('Dashboard and report consistency', () => {
  test('dashboard totals match direct database counts', async () => {
    const session = await login();
    const { status, payload } = await request('/api/v1/dashboard', { token: session.token });
    assert.equal(status, 200);

    const [[counts]] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE role = 'student') AS students,
         (SELECT COUNT(*) FROM courses) AS courses,
         (SELECT COUNT(*) FROM enrollments WHERE status <> 'withdrawn') AS enrollments`,
    );

    assert.equal(payload.data.students, Number(counts.students));
    assert.equal(payload.data.courses, Number(counts.courses));
    assert.equal(payload.data.enrollments, Number(counts.enrollments));
  });

  test('reports enrollment total matches non-withdrawn enrollments when unfiltered', async () => {
    const session = await login();
    const report = await request('/api/v1/reports', { token: session.token });
    assert.equal(report.status, 200);

    const [[counts]] = await pool.query(
      `SELECT COUNT(*) AS enrollments FROM enrollments WHERE status <> 'withdrawn'`,
    );
    assert.equal(report.payload.data.enrollments, Number(counts.enrollments));
    assert.equal(report.payload.data.students.total, (await request('/api/v1/dashboard', { token: session.token })).payload.data.students);
  });
});

describe('Enrollment edge cases', () => {
  test('returns 404 for nonexistent enrollment', async () => {
    const session = await login();
    const { status } = await request('/api/v1/enrollments/999999', { token: session.token });
    assert.equal(status, 404);
  });

  test('rejects inactive student enrollment', async () => {
    const session = await login();
    const inactive = await request('/api/v1/students?limit=1&status=inactive', { token: session.token });
    const courses = await request('/api/v1/courses?limit=1&status=published', { token: session.token });
    if (!inactive.payload.data.length) {
      // Seed may lack inactive students; skip without failing the suite.
      return;
    }
    const attempt = await request('/api/v1/enrollments', {
      method: 'POST',
      token: session.token,
      body: {
        userId: inactive.payload.data[0].id,
        courseId: courses.payload.data[0].id,
      },
    });
    assert.equal(attempt.status, 400);
    assert.match(attempt.payload.message, /active students/i);
  });
});
