import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, describe, test } from 'node:test';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { pool } from '../src/db/pool.js';
import { trackNotifications } from './notificationCleanup.js';
import { cleanupUser, createStudent } from './fixtures.js';

const ADMIN = { email: 'super@eduadmin.test', password: 'Admin123!' };
let STUDENT;
let OTHER;
const suffix = Math.random().toString(16).slice(2, 8);
const CATEGORY = `Store Test ${suffix}`;
const PAID_A = `store-test-paid-a-${suffix}`;
const PAID_B = `store-test-paid-b-${suffix}`;
const FREE = `store-test-free-${suffix}`;

const catalog = [
  { slug: PAID_A, title: 'Store Test Cattle Fattening', subtitle: 'Feedlot basics', category: CATEGORY, price: 500, currency: 'ETB', lessonCount: 2 },
  { slug: PAID_B, title: 'Store Test Poultry', subtitle: 'Layer farming', category: CATEGORY, price: 300, currency: 'ETB', lessonCount: 1 },
  { slug: FREE, title: 'Store Test Free Intro', subtitle: 'Start here', category: CATEGORY, price: 0, currency: 'ETB', lessonCount: 1 },
];
const detail = (course) => ({
  ...course,
  description: `${course.title} full description for the test catalog.`,
  outcomes: ['Plan a ration'],
  requirements: [],
  sections: [{ title: 'Start', lessons: [{ title: 'Welcome', type: 'video', durationMinutes: 5, isPreview: true, videoUrl: 'https://videos.example.org/welcome.mp4' }] }],
});

const PARTNER_KEY = 'p'.repeat(40);
const LESSONS = [{
  id: 7001,
  title: 'Start',
  lessons: [
    { id: 9001, title: 'Welcome', type: 'video', durationMinutes: 5, isPreview: true, videoUrl: 'https://videos.example.org/welcome.mp4', content: null },
    { id: 9002, title: 'Members only', type: 'article', durationMinutes: 12, isPreview: false, videoUrl: null, content: 'Members-only lesson text.' },
  ],
}];

const chapa = { initialized: [], payments: new Map() };
let app;
let ailgStub;
let chapaStub;
let baseUrl;
const original = { ailgApiUrl: env.ailgApiUrl, ailgPartnerKey: env.ailgPartnerKey, chapa: { ...env.chapa } };

function listen(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

const urlOf = (server) => `http://127.0.0.1:${server.address().port}`;

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
  return payload.token;
}

let cleanNotifications;

before(async () => {
  cleanNotifications = await trackNotifications(pool);
  ailgStub = await listen((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const content = req.url.match(/^\/api\/v1\/partner\/courses\/([^/]+)\/content$/);
    if (content) {
      if (req.headers['x-partner-key'] !== PARTNER_KEY) {
        res.statusCode = 401;
        res.end(JSON.stringify({ message: 'Invalid partner key.' }));
        return;
      }
      const course = catalog.find((item) => item.slug === decodeURIComponent(content[1]));
      res.statusCode = course ? 200 : 404;
      res.end(JSON.stringify(course ? { data: { slug: course.slug, title: course.title, sections: LESSONS } } : { message: 'Course not found.' }));
      return;
    }
    if (req.url === '/api/v1/public/courses') {
      res.end(JSON.stringify({ data: catalog }));
      return;
    }
    const slug = decodeURIComponent(req.url.replace('/api/v1/public/courses/', ''));
    const course = catalog.find((item) => item.slug === slug);
    res.statusCode = course ? 200 : 404;
    res.end(JSON.stringify(course ? { data: detail(course) } : { message: 'Course not found.' }));
  });
  chapaStub = await listen(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.headers.authorization !== 'Bearer CHASECK_TEST-stub') {
      res.statusCode = 401;
      res.end(JSON.stringify({ status: 'failed', message: 'Invalid API Key' }));
      return;
    }
    if (req.method === 'POST' && req.url === '/v1/transaction/initialize') {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw);
      chapa.initialized.push(body);
      res.end(JSON.stringify({ status: 'success', data: { checkout_url: `https://checkout.chapa.test/${body.tx_ref}` } }));
      return;
    }
    const txRef = decodeURIComponent(req.url.replace('/v1/transaction/verify/', ''));
    const payment = chapa.payments.get(txRef);
    res.statusCode = payment ? 200 : 400;
    res.end(JSON.stringify(payment ? { status: 'success', data: payment } : { status: 'failed', message: 'Payment not paid yet' }));
  });

  env.ailgApiUrl = urlOf(ailgStub);
  env.chapa.apiUrl = `${urlOf(chapaStub)}/v1`;
  env.chapa.secretKey = 'CHASECK_TEST-stub';
  env.ailgPartnerKey = PARTNER_KEY;

  app = await listen(createApp());
  baseUrl = urlOf(app);
  STUDENT = await createStudent(request, { name: 'Store Fixture Student', password: 'Student123!' });
  OTHER = await createStudent(request, { name: 'Store Other Student', password: 'Student123!' });
});

after(async () => {
  await cleanNotifications?.();
  env.ailgApiUrl = original.ailgApiUrl;
  env.ailgPartnerKey = original.ailgPartnerKey;
  Object.assign(env.chapa, original.chapa);
  const slugs = [PAID_A, PAID_B, FREE];
  const [enrollments] = await pool.query(
    'SELECT e.id FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.source_slug IN (?)',
    [slugs],
  );
  if (enrollments.length) {
    await pool.query(`DELETE FROM activity_logs WHERE entity_type = 'enrollment' AND entity_id IN (?)`, [enrollments.map((row) => row.id)]);
  }
  await pool.query('DELETE o FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN courses c ON c.id = oi.course_id WHERE c.source_slug IN (?)', [slugs]);
  await pool.query('DELETE FROM courses WHERE source_slug IN (?)', [slugs]);
  await pool.query('DELETE FROM categories WHERE name = ?', [CATEGORY]);
  await cleanupUser(STUDENT?.id);
  await cleanupUser(OTHER?.id);
  await Promise.all([app, ailgStub, chapaStub].map((server) => new Promise((resolve) => server.close(resolve))));
  await pool.end();
});

describe('Course catalog from AilgAdmin', () => {
  test('lists published courses with the student state and shows the curriculum', async () => {
    const token = await login(STUDENT);
    const list = await request('/api/v1/student/catalog', { token });
    assert.equal(list.status, 200);
    const paid = list.payload.data.find((item) => item.slug === PAID_A);
    assert.equal(paid.price, 500);
    assert.equal(paid.isFree, false);
    assert.equal(paid.enrollment, null);

    const one = await request(`/api/v1/student/catalog/${PAID_A}`, { token });
    assert.equal(one.status, 200);
    assert.equal(one.payload.data.sections[0].lessons[0].videoUrl, 'https://videos.example.org/welcome.mp4');

    const missing = await request('/api/v1/student/catalog/not-a-real-course', { token });
    assert.equal(missing.status, 404);
  });

  test('admins cannot use the student store', async () => {
    const token = await login(ADMIN);
    const cart = await request('/api/v1/student/cart', { token });
    assert.equal(cart.status, 403);
  });
});

describe('Enrolling without payment', () => {
  test('free courses enroll directly; paid courses refuse', async () => {
    const token = await login(STUDENT);
    const free = await request(`/api/v1/student/catalog/${FREE}/enroll`, { method: 'POST', token });
    assert.equal(free.status, 201);
    assert.equal(free.payload.data.enrollment.status, 'active');
    assert.equal(free.payload.data.enrollment.percent, 0);

    const again = await request(`/api/v1/student/catalog/${FREE}/enroll`, { method: 'POST', token });
    assert.equal(again.status, 409);

    const paid = await request(`/api/v1/student/catalog/${PAID_A}/enroll`, { method: 'POST', token });
    assert.equal(paid.status, 402);

    await request('/api/v1/student/favorites', { method: 'POST', token, body: { slug: PAID_A } });
    const [[linked]] = await pool.query('SELECT id FROM courses WHERE source_slug = ?', [PAID_A]);
    const legacy = await request('/api/v1/student/enrollments', { method: 'POST', token, body: { courseId: linked.id } });
    assert.equal(legacy.status, 402);
  });
});

describe('Cart and favorites', () => {
  test('stores favorites and cart items with server prices', async () => {
    const token = await login(STUDENT);
    const favorites = await request('/api/v1/student/favorites', { token });
    assert.ok(favorites.payload.data.some((item) => item.slug === PAID_A && item.favorite));
    const removed = await request(`/api/v1/student/favorites/${PAID_A}`, { method: 'DELETE', token });
    assert.equal(removed.payload.data.some((item) => item.slug === PAID_A), false);

    await request('/api/v1/student/cart', { method: 'POST', token, body: { slug: PAID_A } });
    const cart = await request('/api/v1/student/cart', { method: 'POST', token, body: { slug: PAID_B } });
    assert.equal(cart.status, 201);
    assert.equal(cart.payload.data.total, 800);
    assert.equal(cart.payload.data.currency, 'ETB');

    const free = await request('/api/v1/student/cart', { method: 'POST', token, body: { slug: FREE } });
    assert.equal(free.status, 400);
  });
});

describe('Chapa checkout', () => {
  test('refuses to start when payments are not configured', async () => {
    const token = await login(STUDENT);
    env.chapa.secretKey = null;
    const result = await request('/api/v1/student/checkout', { method: 'POST', token, body: { slugs: [PAID_A] } });
    env.chapa.secretKey = 'CHASECK_TEST-stub';
    assert.equal(result.status, 503);
  });

  test('a mismatched payment does not enroll', async () => {
    const token = await login(STUDENT);
    const started = await request('/api/v1/student/checkout', { method: 'POST', token, body: { slugs: [PAID_B] } });
    const { txRef } = started.payload.data;
    chapa.payments.set(txRef, { status: 'success', amount: 1, currency: 'ETB', tx_ref: txRef, reference: 'APbad' });
    const confirmed = await request(`/api/v1/student/orders/${txRef}/confirm`, { method: 'POST', token });
    assert.equal(confirmed.payload.data.status, 'failed');
    const course = await request(`/api/v1/student/catalog/${PAID_B}`, { token });
    assert.equal(course.payload.data.enrollment, null);
  });

  test('a verified payment enrolls the student once and empties the cart', async () => {
    const token = await login(STUDENT);
    const started = await request('/api/v1/student/checkout', { method: 'POST', token, body: { slugs: [PAID_A, PAID_B] } });
    assert.equal(started.status, 201);
    const { txRef, checkoutUrl } = started.payload.data;
    assert.equal(checkoutUrl, `https://checkout.chapa.test/${txRef}`);
    const sent = chapa.initialized.find((body) => body.tx_ref === txRef);
    assert.equal(sent.amount, '800.00');
    assert.equal(sent.currency, 'ETB');
    assert.equal(sent.email, STUDENT.email);
    assert.match(sent.return_url, new RegExp(`/learn/checkout/${txRef}$`));

    const pending = await request(`/api/v1/student/orders/${txRef}/confirm`, { method: 'POST', token });
    assert.equal(pending.payload.data.status, 'pending');

    const otherToken = await login({ email: OTHER.email, password: OTHER.password });
    const stranger = await request(`/api/v1/student/orders/${txRef}/confirm`, { method: 'POST', token: otherToken });
    assert.equal(stranger.status, 404);

    chapa.payments.set(txRef, { status: 'success', amount: 800, currency: 'ETB', tx_ref: txRef, reference: 'APtest123' });
    const paid = await request(`/api/v1/student/orders/${txRef}/confirm`, { method: 'POST', token });
    assert.equal(paid.payload.data.status, 'paid');
    assert.equal(paid.payload.data.items.length, 2);
    const repeat = await request(`/api/v1/payments/chapa/callback?trx_ref=${txRef}&status=success`);
    assert.equal(repeat.payload.status, 'paid');
    const notes = (await request('/api/v1/student/notifications', { token })).payload.data.items;
    assert.equal(notes[0].title, 'Payment received');
    assert.match(notes[0].body, /800/);
    assert.equal(notes.filter((note) => note.title === 'Payment received').length, 1);

    const [rows] = await pool.query(
      `SELECT c.source_slug, e.status, p.percent FROM enrollments e
       JOIN courses c ON c.id = e.course_id JOIN users u ON u.id = e.user_id
       JOIN progress p ON p.user_id = e.user_id AND p.course_id = e.course_id
       WHERE u.email = ? AND c.source_slug IN (?, ?)`,
      [STUDENT.email, PAID_A, PAID_B],
    );
    assert.equal(rows.length, 2);
    assert.ok(rows.every((row) => row.status === 'active' && Number(row.percent) === 0));

    const cart = await request('/api/v1/student/cart', { token });
    assert.equal(cart.payload.data.items.length, 0);
    const again = await request('/api/v1/student/checkout', { method: 'POST', token, body: { slugs: [PAID_A] } });
    assert.equal(again.status, 409);
  });
});

describe('Learning a purchased course', () => {
  const progressRow = async () => {
    const [[row]] = await pool.query(
      `SELECT p.percent, p.status, e.status AS enrollment_status FROM progress p
       JOIN enrollments e ON e.user_id = p.user_id AND e.course_id = p.course_id
       JOIN courses c ON c.id = p.course_id JOIN users u ON u.id = p.user_id
       WHERE u.email = ? AND c.source_slug = ?`,
      [STUDENT.email, PAID_A],
    );
    return row;
  };

  test('only enrolled students get the full lessons', async () => {
    const token = await login(STUDENT);
    const locked = await request(`/api/v1/student/learn/${PAID_B.replace('-b-', '-x-')}`, { token });
    assert.equal(locked.status, 403);

    const otherToken = await login({ email: OTHER.email, password: OTHER.password });
    assert.equal((await request(`/api/v1/student/learn/${PAID_A}`, { token: otherToken })).status, 403);
    assert.equal((await request(`/api/v1/student/learn/${PAID_A}/lessons/9002`, { method: 'PUT', token: otherToken, body: { completed: true } })).status, 403);

    const open = await request(`/api/v1/student/learn/${PAID_A}`, { token });
    assert.equal(open.status, 200);
    const lesson = open.payload.data.sections[0].lessons[1];
    assert.equal(lesson.content, 'Members-only lesson text.');
    assert.equal(lesson.completed, false);
    assert.deepEqual(open.payload.data.progress, { completedLessons: 0, totalLessons: 2, percent: 0, status: 'not_started' });

    const adminToken = await login(ADMIN);
    assert.equal((await request(`/api/v1/student/learn/${PAID_A}`, { token: adminToken })).status, 403);
  });

  test('ticking lessons updates the stored progress and enrollment status', async () => {
    const token = await login(STUDENT);
    const path = `/api/v1/student/learn/${PAID_A}/lessons`;

    const one = await request(`${path}/9001`, { method: 'PUT', token, body: { completed: true } });
    assert.equal(one.status, 200);
    assert.equal(one.payload.data.progress.percent, 50);
    assert.deepEqual(await progressRow(), { percent: 50, status: 'in_progress', enrollment_status: 'active' });

    await request(`${path}/9001`, { method: 'PUT', token, body: { completed: true } });
    const both = await request(`${path}/9002`, { method: 'PUT', token, body: { completed: true } });
    assert.equal(both.payload.data.progress.percent, 100);
    assert.equal(both.payload.data.enrollmentStatus, 'completed');
    assert.deepEqual(await progressRow(), { percent: 100, status: 'completed', enrollment_status: 'completed' });
    const [latest] = (await request('/api/v1/student/notifications', { token })).payload.data.items;
    assert.equal(latest.type, 'completion');
    assert.equal(latest.link, `/learn/courses/${PAID_A}/learn`);

    const undo = await request(`${path}/9002`, { method: 'PUT', token, body: { completed: false } });
    assert.equal(undo.payload.data.enrollmentStatus, 'active');
    assert.deepEqual(await progressRow(), { percent: 50, status: 'in_progress', enrollment_status: 'active' });

    assert.equal((await request(`${path}/12345`, { method: 'PUT', token, body: { completed: true } })).status, 404);
    assert.equal((await request(`${path}/9001`, { method: 'PUT', token, body: { completed: 'yes' } })).status, 400);
  });

  test('lessons stay closed when the partner key is not set', async () => {
    const token = await login(STUDENT);
    env.ailgPartnerKey = null;
    const result = await request(`/api/v1/student/learn/${PAID_A}`, { token });
    env.ailgPartnerKey = PARTNER_KEY;
    assert.equal(result.status, 503);
  });
});
