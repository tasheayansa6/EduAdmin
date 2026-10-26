import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { trackNotifications } from './notificationCleanup.js';
import { cleanupCourse, cleanupEnrollment, cleanupUser, createCourse, createStudent } from './fixtures.js';

const ADMIN = { email: 'super@eduadmin.test', password: 'Admin123!' };
const SUPER = ADMIN;

let server;
let baseUrl;
let STUDENT;
let fixtureCourse;
let fixtureEnrollmentId;

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

async function withStaffAdmin(run) {
  const email = `staff.${Date.now()}@eduadmin.test`;
  const password = 'Admin123!';
  const passwordHash = await bcrypt.hash(password, 4);
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, status)
     VALUES ('Staff Admin', ?, ?, 'admin', 'active')`,
    [email, passwordHash],
  );
  try {
    return await run({ email, password, id: result.insertId });
  } finally {
    await pool.query('DELETE FROM users WHERE id = ?', [result.insertId]);
  }
}

async function login(credentials) {
  const { status, payload } = await request('/api/v1/auth/login', {
    method: 'POST',
    body: credentials,
  });
  return { status, payload };
}

let cleanNotifications;
const createdCourseIds = [];

before(async () => {
  cleanNotifications = await trackNotifications(pool);
  const app = createApp();
  server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;

  STUDENT = await createStudent(request, { name: 'API Fixture Student' });
  const { payload: session } = await login(ADMIN);
  fixtureCourse = await createCourse(request, session.token, { title: `API Fixture Course ${Date.now()}` });
  createdCourseIds.push(fixtureCourse.id);
  const enrolled = await request('/api/v1/enrollments', {
    method: 'POST',
    token: session.token,
    body: { userId: STUDENT.id, courseId: fixtureCourse.id },
  });
  assert.equal(enrolled.status, 201);
  fixtureEnrollmentId = enrolled.payload.data.id;
});

after(async () => {
  await cleanNotifications?.();
  await cleanupEnrollment(fixtureEnrollmentId);
  if (fixtureEnrollmentId) {
    await pool.query('DELETE FROM progress WHERE user_id = ? AND course_id = ?', [STUDENT?.id, fixtureCourse?.id]);
    await pool.query('DELETE FROM enrollments WHERE id = ?', [fixtureEnrollmentId]);
  }
  for (const id of createdCourseIds) await cleanupCourse(id);
  await cleanupUser(STUDENT?.id);
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

describe('AUTH', () => {
  test('rejects invalid credentials with 401', async () => {
    const { status, payload } = await login({
      email: ADMIN.email,
      password: 'wrong-password',
    });
    assert.equal(status, 401);
    assert.ok(payload.message);
  });

  test('rejects unknown email with the same generic 401 message', async () => {
    const { status, payload } = await login({
      email: 'nobody@eduadmin.test',
      password: 'Admin123!',
    });
    assert.equal(status, 401);
    assert.equal(payload.message, 'Email or password is incorrect.');
  });

  test('student login cannot open the admin dashboard', async () => {
    const { status, payload } = await login(STUDENT);
    assert.equal(status, 200);
    assert.equal(payload.user.role, 'student');
    assert.equal(payload.user.password_hash, undefined);
    const dashboard = await request('/api/v1/dashboard', { token: payload.token });
    assert.equal(dashboard.status, 403);
  });

  test('allows admin login and returns a token without password fields', async () => {
    const { status, payload } = await login(ADMIN);
    assert.equal(status, 200);
    assert.ok(payload.token);
    assert.equal(payload.user.role, 'super_admin');
    assert.equal(payload.user.email, ADMIN.email);
    assert.equal(payload.user.password_hash, undefined);
    assert.equal(payload.password_hash, undefined);
  });

  test('returns the current user for a valid session', async () => {
    const { payload: session } = await login(ADMIN);
    const { status, payload } = await request('/api/v1/auth/me', {
      token: session.token,
    });
    assert.equal(status, 200);
    assert.equal(payload.user.email, ADMIN.email);
    assert.equal(payload.user.password_hash, undefined);
  });

  test('logout invalidates the previous token', async () => {
    const { payload: session } = await login(ADMIN);
    const loggedOut = await request('/api/v1/auth/logout', {
      method: 'POST',
      token: session.token,
    });
    assert.equal(loggedOut.status, 204);

    const me = await request('/api/v1/auth/me', { token: session.token });
    assert.equal(me.status, 401);

    const dashboard = await request('/api/v1/dashboard', { token: session.token });
    assert.equal(dashboard.status, 401);
  });

  test('rejects malformed bearer tokens with 401', async () => {
    const { status } = await request('/api/v1/dashboard', {
      token: 'not-a-valid-jwt',
    });
    assert.equal(status, 401);
  });
});

describe('Authorization', () => {
  const protectedGets = [
    '/api/v1/dashboard',
    '/api/v1/students',
    '/api/v1/courses',
    '/api/v1/enrollments',
    '/api/v1/progress',
    '/api/v1/reports',
    '/api/v1/lookups',
  ];

  for (const path of protectedGets) {
    test(`unauthenticated GET ${path} returns 401`, async () => {
      const { status } = await request(path);
      assert.equal(status, 401);
    });
  }

  test('admin can load dashboard totals from the database', async () => {
    const { payload: session } = await login(ADMIN);
    const { status, payload } = await request('/api/v1/dashboard', {
      token: session.token,
    });
    assert.equal(status, 200);
    assert.equal(typeof payload.data.students, 'number');
    assert.equal(typeof payload.data.courses, 'number');
    assert.equal(typeof payload.data.enrollments, 'number');
    assert.ok(payload.data.students > 0);
  });

  test('admin can access student management APIs', async () => {
    const { payload: session } = await login(ADMIN);
    const { status, payload } = await request('/api/v1/students?limit=5', {
      token: session.token,
    });
    assert.equal(status, 200);
    assert.ok(Array.isArray(payload.data));
    assert.ok(payload.meta);
  });

  test('admin can create a student account', async () => {
    const { payload: session } = await login(ADMIN);
    const email = `admin-created-${Date.now()}@students.test`;
    const created = await request('/api/v1/students', {
      method: 'POST',
      token: session.token,
      body: { name: 'Admin Created Student', email, password: 'Student123!' },
    });
    assert.equal(created.status, 201);
    assert.equal(created.payload.data.email, email);
    assert.equal(created.payload.data.status, 'active');
    const signedIn = await login({ email, password: 'Student123!' });
    assert.equal(signedIn.status, 200);
    assert.equal(signedIn.payload.user.role, 'student');
    await cleanupUser(created.payload.data.id);
  });

  test('admin cannot list administrators', async () => {
    await withStaffAdmin(async (staff) => {
      const { payload: session } = await login(staff);
      const { status } = await request('/api/v1/administrators', {
        token: session.token,
      });
      assert.equal(status, 403);
    });
  });

  test('super admin can list administrators', async () => {
    const { payload: session } = await login(SUPER);
    const { status, payload } = await request('/api/v1/administrators', {
      token: session.token,
    });
    assert.equal(status, 200);
    assert.ok(Array.isArray(payload.data));
    assert.ok(payload.data.some((row) => row.role === 'super_admin'));
  });

  test('inactive administrator tokens are rejected', async () => {
    await withStaffAdmin(async (staff) => {
      const { payload: session } = await login(staff);
      await pool.query(`UPDATE users SET status = 'inactive' WHERE id = ?`, [staff.id]);
      const { status } = await request('/api/v1/auth/me', { token: session.token });
      assert.equal(status, 401);
    });
  });
});
describe('Enrollments', () => {
  test('unauthenticated enrollment list returns 401', async () => {
    const { status } = await request('/api/v1/enrollments');
    assert.equal(status, 401);
  });

  test('admin can list enrollments with pagination meta', async () => {
    const { payload: session } = await login(ADMIN);
    const { status, payload } = await request('/api/v1/enrollments?limit=5', {
      token: session.token,
    });
    assert.equal(status, 200);
    assert.ok(Array.isArray(payload.data));
    assert.ok(payload.meta);
    assert.equal(typeof payload.meta.total, 'number');
  });

  test('rejects invalid student or course ids when creating', async () => {
    const { payload: session } = await login(ADMIN);
    const badStudent = await request('/api/v1/enrollments', {
      method: 'POST',
      token: session.token,
      body: { userId: 999999, courseId: 1 },
    });
    assert.equal(badStudent.status, 400);

    const students = await request('/api/v1/students?limit=1&status=active', {
      token: session.token,
    });
    const student = students.payload.data[0];
    const badCourse = await request('/api/v1/enrollments', {
      method: 'POST',
      token: session.token,
      body: { userId: student.id, courseId: 999999 },
    });
    assert.equal(badCourse.status, 400);
  });

  test('creates enrollment for a published course and returns progress fields', async () => {
    const { payload: session } = await login(ADMIN);
    const students = await request('/api/v1/students?limit=20&status=active', {
      token: session.token,
    });
    const courses = await request('/api/v1/courses?limit=50&status=published', {
      token: session.token,
    });
    const course = courses.payload.data[0];
    assert.ok(course);

    let created = null;
    for (const student of students.payload.data) {
      const attempt = await request('/api/v1/enrollments', {
        method: 'POST',
        token: session.token,
        body: { userId: student.id, courseId: course.id },
      });
      if (attempt.status === 201) {
        created = attempt.payload.data;
        break;
      }
      if (attempt.status !== 409) {
        assert.fail(`unexpected create status ${attempt.status}`);
      }
    }
    assert.ok(created, 'expected at least one student without that enrollment');
    assert.equal(typeof created.id, 'number');
    // New enrollments start at 0; reactivating a withdrawn row preserves existing progress.
    assert.equal(typeof created.percent, 'number');
    assert.ok(created.percent >= 0 && created.percent <= 100);
    assert.ok(['not_started', 'in_progress', 'completed'].includes(created.progressStatus));

    const detail = await request(`/api/v1/enrollments/${created.id}`, {
      token: session.token,
    });
    assert.equal(detail.status, 200);
    assert.equal(detail.payload.data.id, created.id);
  });

  test('rejects duplicate active enrollments with 409', async () => {
    const { payload: session } = await login(ADMIN);
    const students = await request('/api/v1/students?limit=1&status=active', {
      token: session.token,
    });
    const courses = await request('/api/v1/courses?limit=20&status=published', {
      token: session.token,
    });
    const student = students.payload.data[0];
    const course = courses.payload.data[0];
    assert.ok(student && course);

    const first = await request('/api/v1/enrollments', {
      method: 'POST',
      token: session.token,
      body: { userId: student.id, courseId: course.id },
    });
    assert.ok([201, 409].includes(first.status), `unexpected status ${first.status}`);

    const second = await request('/api/v1/enrollments', {
      method: 'POST',
      token: session.token,
      body: { userId: student.id, courseId: course.id },
    });
    assert.equal(second.status, 409);
  });

  test('PATCH completed updates enrollment and sets progress to 100%', async () => {
    const { payload: session } = await login(ADMIN);
    const list = await request('/api/v1/enrollments?status=active&limit=1', {
      token: session.token,
    });
    const enrollment = list.payload.data[0];
    assert.ok(enrollment, 'expected an active enrollment from fixtures');

    const updated = await request(`/api/v1/enrollments/${enrollment.id}`, {
      method: 'PATCH',
      token: session.token,
      body: { status: 'completed' },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.payload.data.status, 'completed');
    assert.equal(updated.payload.data.percent, 100);
    assert.equal(updated.payload.data.progressStatus, 'completed');
  });

  test('DELETE withdraws an enrollment instead of hard-deleting it', async () => {
    const { payload: session } = await login(ADMIN);
    const list = await request('/api/v1/enrollments?status=active&limit=1', {
      token: session.token,
    });
    const enrollment = list.payload.data[0];
    assert.ok(enrollment, 'expected an active enrollment from fixtures');

    const removed = await request(`/api/v1/enrollments/${enrollment.id}`, {
      method: 'DELETE',
      token: session.token,
    });
    assert.equal(removed.status, 204);

    const check = await request(`/api/v1/enrollments?q=${encodeURIComponent(enrollment.studentName)}&limit=50`, {
      token: session.token,
    });
    const row = check.payload.data.find((item) => item.id === enrollment.id);
    assert.ok(row, 'enrollment row should still exist');
    assert.equal(row.status, 'withdrawn');
  });

  test('search and status filters return 200', async () => {
    const { payload: session } = await login(ADMIN);
    const { status, payload } = await request('/api/v1/enrollments?q=a&status=active&limit=5', {
      token: session.token,
    });
    assert.equal(status, 200);
    assert.ok(Array.isArray(payload.data));
  });
});

describe('Progress', () => {
  test('unauthenticated progress list returns 401', async () => {
    const { status } = await request('/api/v1/progress');
    assert.equal(status, 401);
  });

  test('admin can list progress with percent values', async () => {
    const { payload: session } = await login(ADMIN);
    const { status, payload } = await request('/api/v1/progress?limit=10', {
      token: session.token,
    });
    assert.equal(status, 200);
    assert.ok(Array.isArray(payload.data));
    if (payload.data.length) {
      const row = payload.data[0];
      assert.equal(typeof row.percent, 'number');
      assert.ok(row.percent >= 0 && row.percent <= 100);
      assert.ok(['not_started', 'in_progress', 'completed'].includes(row.status));
    }
  });
});

describe('Reports', () => {
  test('unauthenticated reports return 401', async () => {
    const { status } = await request('/api/v1/reports');
    assert.equal(status, 401);
  });

  test('rejects invalid date ranges', async () => {
    const { payload: session } = await login(ADMIN);
    const { status, payload } = await request('/api/v1/reports?from=2026-12-01&to=2026-01-01', {
      token: session.token,
    });
    assert.equal(status, 400);
    assert.match(payload.message, /start date/i);
  });

  test('admin receives aggregate report fields from the database', async () => {
    const { payload: session } = await login(ADMIN);
    const { status, payload } = await request('/api/v1/reports', {
      token: session.token,
    });
    assert.equal(status, 200);
    const data = payload.data;
    assert.equal(typeof data.students.total, 'number');
    assert.equal(typeof data.courses, 'number');
    assert.equal(typeof data.enrollments, 'number');
    assert.ok(Array.isArray(data.enrollmentTrend));
    assert.ok(Array.isArray(data.studentRegistrationTrend));
    assert.ok(Array.isArray(data.courseRows));
    assert.equal(typeof data.progress.averageProgress, 'number');
  });

  test('dashboard totals are numeric and non-hardcoded shape', async () => {
    const { payload: session } = await login(ADMIN);
    const { status, payload } = await request('/api/v1/dashboard', {
      token: session.token,
    });
    assert.equal(status, 200);
    assert.ok(payload.data.students >= 0);
    assert.ok(payload.data.courses >= 0);
    assert.ok(payload.data.enrollments >= 0);
    assert.ok(Array.isArray(payload.data.enrollmentTrend));
  });

  test('CSV export is authorized and returns csv content', async () => {
    const { payload: session } = await login(ADMIN);
    const response = await fetch(`${baseUrl}/api/v1/reports/export`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
        Accept: 'text/csv',
      },
    });
    assert.equal(response.status, 200);
    const text = await response.text();
    assert.match(text, /Course,Category/);
    assert.equal(response.headers.get('content-type')?.includes('text/csv'), true);
  });

  test('unauthenticated CSV export returns 401', async () => {
    const response = await fetch(`${baseUrl}/api/v1/reports/export`, {
      headers: { Accept: 'text/csv' },
    });
    assert.equal(response.status, 401);
  });

  test('course filter narrows courseRows to one course', async () => {
    const { payload: session } = await login(ADMIN);
    const { payload: lookups } = await request('/api/v1/lookups', { token: session.token });
    const course = lookups.data.courses[0];
    assert.ok(course?.id);

    const { status, payload } = await request(`/api/v1/reports?courseId=${course.id}`, {
      token: session.token,
    });
    assert.equal(status, 200);
    assert.equal(payload.data.courseId, course.id);
    assert.ok(payload.data.courseRows.every((row) => row.id === course.id));
  });

  test('date filter applies inclusive end date without inventing progress', async () => {
    const { payload: session } = await login(ADMIN);
    const { status, payload } = await request('/api/v1/reports?from=2099-01-01&to=2099-01-31', {
      token: session.token,
    });
    assert.equal(status, 200);
    assert.equal(payload.data.enrollments, 0);
    assert.equal(payload.data.progress.tracked, 0);
    assert.equal(payload.data.progress.averageProgress, 0);
    assert.ok(payload.data.enrollmentTrend.every((point) => point.count === 0));
  });
});
describe('Courses', () => {
  test('DELETE permanently removes a course', async () => {
    const { payload: session } = await login(ADMIN);
    const created = await request('/api/v1/courses', {
      method: 'POST',
      token: session.token,
      body: {
        title: `Temp Course ${Date.now()}`,
        description: 'Temporary course for hard-delete coverage.',
        categoryId: 1,
        status: 'published',
      },
    });
    assert.equal(created.status, 201);
    const courseId = created.payload.data.id;
    const title = created.payload.data.title;

    const deleted = await request(`/api/v1/courses/${courseId}`, {
      method: 'DELETE',
      token: session.token,
    });
    assert.equal(deleted.status, 204);

    const listed = await request(`/api/v1/courses?q=${encodeURIComponent(title)}&limit=20`, {
      token: session.token,
    });
    const row = listed.payload.data.find((item) => item.id === courseId);
    assert.equal(row, undefined, 'course should be removed from the catalog');
  });
});
