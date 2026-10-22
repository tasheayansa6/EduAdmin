import crypto from 'crypto';
import { env } from '../config/env.js';
import { pool } from '../db/pool.js';
import { logActivity } from '../lib/activity.js';
import { getCatalogCourse, listCatalogCourses } from '../lib/ailgCatalog.js';
import { initializePayment, paymentsEnabled, verifyPayment } from '../lib/chapa.js';
import { AppError } from '../lib/errors.js';
import { notify } from '../lib/notify.js';

const MAX_CHECKOUT_ITEMS = 20;

const isPaid = (course) => Number(course.price) > 0;

async function requireCatalogCourse(slug) {
  const course = await getCatalogCourse(slug);
  if (!course) throw new AppError(404, 'This course is not available.');
  return course;
}

/** Enrollment, cart, and favorite state for the given AilgAdmin slugs, keyed by slug. */
async function studentState(userId, slugs) {
  if (!slugs.length) return new Map();
  const [rows] = await pool.query(
    `SELECT c.id, c.source_slug, e.status AS enrollment_status, e.enrolled_at, p.percent, p.status AS progress_status,
       EXISTS (SELECT 1 FROM cart_items ci WHERE ci.user_id = ? AND ci.course_id = c.id) AS in_cart,
       EXISTS (SELECT 1 FROM favorites f WHERE f.user_id = ? AND f.course_id = c.id) AS favorite
     FROM courses c
     LEFT JOIN enrollments e ON e.course_id = c.id AND e.user_id = ?
     LEFT JOIN progress p ON p.course_id = c.id AND p.user_id = ?
     WHERE c.source_slug IN (?)`,
    [userId, userId, userId, userId, slugs],
  );
  return new Map(rows.map((row) => [row.source_slug, row]));
}

function withState(course, state) {
  const active = state?.enrollment_status && state.enrollment_status !== 'withdrawn';
  return {
    ...course,
    price: Number(course.price),
    isFree: !isPaid(course),
    courseId: state?.id ?? null,
    enrollment: active
      ? {
        status: state.enrollment_status,
        enrolledAt: state.enrolled_at,
        percent: state.percent == null ? null : Number(state.percent),
        progressStatus: state.progress_status ?? null,
      }
      : null,
    inCart: Boolean(state?.in_cart),
    favorite: Boolean(state?.favorite),
  };
}

export async function getCatalog(userId) {
  const courses = await listCatalogCourses();
  const state = await studentState(userId, courses.map((course) => course.slug));
  return courses.map((course) => withState(course, state.get(course.slug)));
}

export async function getCatalogDetail(userId, slug) {
  const course = await requireCatalogCourse(slug);
  const state = await studentState(userId, [slug]);
  return withState(course, state.get(slug));
}

/** Returns the local course row for an AilgAdmin course, creating it on first use. */
async function linkCourse(executor, course) {
  const categoryName = String(course.category || 'General').slice(0, 80);
  await executor.query('INSERT INTO categories (name) VALUES (?) ON DUPLICATE KEY UPDATE id = id', [categoryName]);
  const [[category]] = await executor.query('SELECT id FROM categories WHERE name = ?', [categoryName]);
  const title = String(course.title).slice(0, 180);
  const description = course.description || course.subtitle || course.title;

  const [existing] = await executor.query('SELECT id FROM courses WHERE source_slug = ?', [course.slug]);
  if (existing[0]) {
    await executor.query(
      'UPDATE courses SET title = ?, description = ?, category_id = ? WHERE id = ?',
      [title, description, category.id, existing[0].id],
    );
    return existing[0].id;
  }
  try {
    const [result] = await executor.query(
      `INSERT INTO courses (title, description, category_id, status, source_slug) VALUES (?, ?, ?, 'published', ?)`,
      [title, description, category.id, course.slug],
    );
    return result.insertId;
  } catch (error) {
    if (error.code !== 'ER_DUP_ENTRY') throw error;
    const [again] = await executor.query('SELECT id FROM courses WHERE source_slug = ?', [course.slug]);
    return again[0].id;
  }
}

async function activeEnrollment(executor, userId, courseId) {
  const [rows] = await executor.query(
    `SELECT status FROM enrollments WHERE user_id = ? AND course_id = ? AND status <> 'withdrawn'`,
    [userId, courseId],
  );
  return rows[0] ?? null;
}

/** Creates or reactivates an enrollment inside the caller's transaction. Existing progress is kept. */
async function grantEnrollment(connection, { userId, courseId, actorId, details }) {
  const [rows] = await connection.query(
    'SELECT id, status FROM enrollments WHERE user_id = ? AND course_id = ? FOR UPDATE',
    [userId, courseId],
  );
  if (rows[0] && rows[0].status !== 'withdrawn') return false;
  let enrollmentId = rows[0]?.id;
  if (rows[0]) {
    await connection.query(`UPDATE enrollments SET status = 'active', enrolled_at = UTC_TIMESTAMP() WHERE id = ?`, [enrollmentId]);
  } else {
    const [result] = await connection.query(`INSERT INTO enrollments (user_id, course_id, status) VALUES (?, ?, 'active')`, [userId, courseId]);
    enrollmentId = result.insertId;
  }
  await connection.query(
    `INSERT INTO progress (user_id, course_id, percent, status) VALUES (?, ?, 0, 'not_started')
     ON DUPLICATE KEY UPDATE user_id = user_id`,
    [userId, courseId],
  );
  await logActivity(connection, { actorId, action: 'enrollment.created', entityType: 'enrollment', entityId: enrollmentId, details });
  await connection.query('DELETE FROM cart_items WHERE user_id = ? AND course_id = ?', [userId, courseId]);
  return true;
}

async function withTransaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/** Free courses enroll straight away; paid ones must go through checkout. */
export async function enrollFree(user, slug) {
  const course = await requireCatalogCourse(slug);
  if (isPaid(course)) throw new AppError(402, 'This is a paid course. Pay with Chapa to enroll.');
  await withTransaction(async (connection) => {
    const courseId = await linkCourse(connection, course);
    const granted = await grantEnrollment(connection, {
      userId: user.id,
      courseId,
      actorId: user.id,
      details: `${user.name} enrolled in ${course.title} (free)`,
    });
    if (!granted) throw new AppError(409, 'You are already enrolled in this course.');
    await notify(connection, user.id, {
      type: 'enrollment',
      title: `You enrolled in ${course.title}`,
      body: 'The course is now in My learning. Start the first lesson whenever you are ready.',
      link: `/learn/courses/${course.slug}/learn`,
    });
  });
  return getCatalogDetail(user.id, slug);
}

/** Loads a published EduAdmin-only course (not an AILG store link). */
async function requireLocalCourse(courseId) {
  const [[row]] = await pool.query(
    `SELECT c.id, c.title, c.description, c.price, c.currency, c.status, c.source_slug, cat.name AS category_name
     FROM courses c JOIN categories cat ON cat.id = c.category_id WHERE c.id = ?`,
    [courseId],
  );
  if (!row || row.source_slug) throw new AppError(404, 'This course is not available.');
  if (row.status !== 'published') throw new AppError(404, 'This course is not published.');
  return {
    local: true,
    id: row.id,
    courseId: row.id,
    slug: null,
    title: row.title,
    subtitle: row.description,
    description: row.description,
    category: row.category_name,
    price: Number(row.price),
    currency: row.currency || 'ETB',
    isFree: Number(row.price) <= 0,
  };
}

async function localStudentState(userId, courseIds) {
  if (!courseIds.length) return new Map();
  const [rows] = await pool.query(
    `SELECT c.id, e.status AS enrollment_status, e.enrolled_at, p.percent, p.status AS progress_status,
       EXISTS (SELECT 1 FROM cart_items ci WHERE ci.user_id = ? AND ci.course_id = c.id) AS in_cart,
       EXISTS (SELECT 1 FROM favorites f WHERE f.user_id = ? AND f.course_id = c.id) AS favorite
     FROM courses c
     LEFT JOIN enrollments e ON e.course_id = c.id AND e.user_id = ?
     LEFT JOIN progress p ON p.course_id = c.id AND p.user_id = ?
     WHERE c.id IN (?) AND c.source_slug IS NULL`,
    [userId, userId, userId, userId, courseIds],
  );
  return new Map(rows.map((row) => [row.id, row]));
}

function withLocalState(course, state) {
  const active = state?.enrollment_status && state.enrollment_status !== 'withdrawn';
  return {
    ...course,
    enrollment: active
      ? {
        status: state.enrollment_status,
        enrolledAt: state.enrolled_at,
        percent: state.percent == null ? null : Number(state.percent),
        progressStatus: state.progress_status ?? null,
      }
      : null,
    inCart: Boolean(state?.in_cart),
    favorite: Boolean(state?.favorite),
  };
}

async function listSaved(table, userId) {
  const stamp = table === 'cart_items' ? 'added_at' : 'created_at';
  const [rows] = await pool.query(
    `SELECT c.id, c.source_slug, c.title, c.description, c.price, c.currency, cat.name AS category_name,
            t.${stamp} AS saved_at
     FROM ${table} t
     JOIN courses c ON c.id = t.course_id
     JOIN categories cat ON cat.id = c.category_id
     WHERE t.user_id = ?
     ORDER BY saved_at DESC, t.id DESC`,
    [userId],
  );
  if (!rows.length) return [];

  const storeRows = rows.filter((row) => row.source_slug);
  const localRows = rows.filter((row) => !row.source_slug);
  let catalog = new Map();
  let storeState = new Map();
  try {
    catalog = new Map((await listCatalogCourses()).map((course) => [course.slug, course]));
    storeState = await studentState(userId, storeRows.map((row) => row.source_slug));
  } catch {
    // AILG can be offline; still return local saved courses and mark store ones unavailable.
  }
  const localState = await localStudentState(userId, localRows.map((row) => row.id));

  return rows.map((row) => {
    if (row.source_slug) {
      const live = catalog.get(row.source_slug);
      const item = live
        ? withState(live, storeState.get(row.source_slug))
        : { slug: row.source_slug, title: row.title, unavailable: true, local: false };
      return { ...item, key: row.source_slug, savedAt: row.saved_at };
    }
    const course = {
      local: true,
      id: row.id,
      courseId: row.id,
      slug: null,
      title: row.title,
      subtitle: row.description,
      description: row.description,
      category: row.category_name,
      price: Number(row.price),
      currency: row.currency || 'ETB',
      isFree: Number(row.price) <= 0,
    };
    return { ...withLocalState(course, localState.get(row.id)), key: `local-${row.id}`, savedAt: row.saved_at };
  });
}

export async function getCart(userId) {
  const items = await listSaved('cart_items', userId);
  const payable = items.filter((item) => !item.unavailable && !item.enrollment && isPaid(item));
  const currencies = [...new Set(payable.map((item) => item.currency))];
  return {
    items,
    total: payable.reduce((sum, item) => sum + item.price, 0),
    currency: currencies.length === 1 ? currencies[0] : null,
    mixedCurrencies: currencies.length > 1,
    paymentsEnabled: paymentsEnabled(),
  };
}

export async function addToCart(userId, { slug, courseId }) {
  await withTransaction(async (connection) => {
    let id;
    if (slug) {
      const course = await requireCatalogCourse(slug);
      if (!isPaid(course)) throw new AppError(400, 'This course is free. Enroll in it directly.');
      id = await linkCourse(connection, course);
    } else {
      const course = await requireLocalCourse(courseId);
      if (!isPaid(course)) throw new AppError(400, 'This course is free. Enroll in it directly.');
      id = course.id;
    }
    if (await activeEnrollment(connection, userId, id)) throw new AppError(409, 'You are already enrolled in this course.');
    await connection.query('INSERT IGNORE INTO cart_items (user_id, course_id) VALUES (?, ?)', [userId, id]);
  });
  return getCart(userId);
}

export async function removeFromCart(userId, { slug, courseId }) {
  if (slug) {
    await pool.query(
      'DELETE ci FROM cart_items ci JOIN courses c ON c.id = ci.course_id WHERE ci.user_id = ? AND c.source_slug = ?',
      [userId, slug],
    );
  } else {
    await pool.query(
      'DELETE ci FROM cart_items ci JOIN courses c ON c.id = ci.course_id WHERE ci.user_id = ? AND c.id = ? AND c.source_slug IS NULL',
      [userId, courseId],
    );
  }
  return getCart(userId);
}

export function getFavorites(userId) {
  return listSaved('favorites', userId);
}

export async function addFavorite(userId, { slug, courseId }) {
  await withTransaction(async (connection) => {
    let id;
    if (slug) {
      const course = await requireCatalogCourse(slug);
      id = await linkCourse(connection, course);
    } else {
      const course = await requireLocalCourse(courseId);
      id = course.id;
    }
    await connection.query('INSERT IGNORE INTO favorites (user_id, course_id) VALUES (?, ?)', [userId, id]);
  });
  return getFavorites(userId);
}

export async function removeFavorite(userId, { slug, courseId }) {
  if (slug) {
    await pool.query(
      'DELETE f FROM favorites f JOIN courses c ON c.id = f.course_id WHERE f.user_id = ? AND c.source_slug = ?',
      [userId, slug],
    );
  } else {
    await pool.query(
      'DELETE f FROM favorites f JOIN courses c ON c.id = f.course_id WHERE f.user_id = ? AND c.id = ? AND c.source_slug IS NULL',
      [userId, courseId],
    );
  }
  return getFavorites(userId);
}

function splitName(name) {
  const parts = String(name).trim().split(/\s+/);
  return { firstName: parts[0] || 'Student', lastName: parts.slice(1).join(' ') || parts[0] || 'Student' };
}

/**
 * Prices come from AilgAdmin for store courses and from the courses table for EduAdmin courses.
 * The browser never chooses the amount.
 */
export async function startCheckout(user, { slugs = [], courseIds = [] } = {}) {
  if (!paymentsEnabled()) throw new AppError(503, 'Online payment is not set up yet. Please try again later.');
  const uniqueSlugs = [...new Set(slugs)];
  const uniqueIds = [...new Set(courseIds)];
  if (!uniqueSlugs.length && !uniqueIds.length) throw new AppError(400, 'Choose at least one course.');
  if (uniqueSlugs.length + uniqueIds.length > MAX_CHECKOUT_ITEMS) {
    throw new AppError(400, `Choose between 1 and ${MAX_CHECKOUT_ITEMS} courses.`);
  }

  const storeCourses = await Promise.all(uniqueSlugs.map(requireCatalogCourse));
  const localCourses = await Promise.all(uniqueIds.map(requireLocalCourse));
  const courses = [
    ...storeCourses.map((course) => ({ ...course, local: false })),
    ...localCourses,
  ];
  const free = courses.find((course) => !isPaid(course));
  if (free) throw new AppError(400, `“${free.title}” is free. Enroll in it directly instead of paying.`);
  const currencies = new Set(courses.map((course) => course.currency));
  if (currencies.size > 1) throw new AppError(400, 'Check out courses priced in one currency at a time.');
  const [currency] = currencies;
  const amount = Math.round(courses.reduce((sum, course) => sum + Number(course.price), 0) * 100) / 100;
  const txRef = `eduadmin-${crypto.randomUUID()}`;

  await withTransaction(async (connection) => {
    const linked = [];
    for (const course of courses) {
      const courseId = course.local ? course.id : await linkCourse(connection, course);
      if (await activeEnrollment(connection, user.id, courseId)) {
        throw new AppError(409, `You are already enrolled in “${course.title}”. Remove it from your cart.`);
      }
      linked.push({ courseId, course });
    }
    const [order] = await connection.query(
      'INSERT INTO orders (user_id, tx_ref, amount, currency) VALUES (?, ?, ?, ?)',
      [user.id, txRef, amount, currency],
    );
    for (const { courseId, course } of linked) {
      await connection.query(
        'INSERT INTO order_items (order_id, course_id, title, price) VALUES (?, ?, ?, ?)',
        [order.insertId, courseId, String(course.title).slice(0, 180), Number(course.price)],
      );
    }
  });

  try {
    const checkoutUrl = await initializePayment({
      amount,
      currency,
      email: user.email,
      ...splitName(user.name),
      txRef,
      returnUrl: `${env.clientOrigin}/learn/checkout/${txRef}`,
      callbackUrl: env.apiPublicUrl ? `${env.apiPublicUrl}/api/v1/payments/chapa/callback` : null,
    });
    await pool.query('UPDATE orders SET checkout_url = ? WHERE tx_ref = ?', [checkoutUrl, txRef]);
    return { txRef, checkoutUrl };
  } catch (error) {
    await pool.query(`UPDATE orders SET status = 'failed' WHERE tx_ref = ?`, [txRef]);
    throw error;
  }
}

async function loadOrder(txRef, userId) {
  const [orders] = await pool.query(
    `SELECT o.*, u.name AS user_name FROM orders o JOIN users u ON u.id = o.user_id
     WHERE o.tx_ref = ? ${userId ? 'AND o.user_id = ?' : ''}`,
    userId ? [txRef, userId] : [txRef],
  );
  if (!orders[0]) throw new AppError(404, 'Payment not found.');
  const [items] = await pool.query(
    `SELECT oi.course_id, oi.title, oi.price, c.source_slug
     FROM order_items oi JOIN courses c ON c.id = oi.course_id WHERE oi.order_id = ? ORDER BY oi.id`,
    [orders[0].id],
  );
  return { order: orders[0], items };
}

function mapOrder({ order, items }) {
  return {
    txRef: order.tx_ref,
    status: order.status,
    amount: Number(order.amount),
    currency: order.currency,
    createdAt: order.created_at,
    paidAt: order.paid_at,
    items: items.map((item) => ({
      slug: item.source_slug,
      courseId: item.course_id,
      local: !item.source_slug,
      title: item.title,
      price: Number(item.price),
    })),
  };
}

/**
 * Confirms a payment with Chapa's verify endpoint and enrolls the student once.
 * Safe to call repeatedly from the return page and from Chapa's callback.
 */
export async function confirmOrder(txRef, userId = null) {
  const loaded = await loadOrder(txRef, userId);
  if (loaded.order.status !== 'pending') return mapOrder(loaded);

  const payment = await verifyPayment(txRef);
  if (!payment) return mapOrder(loaded);

  const amountMatches = Math.abs(Number(payment.amount) - Number(loaded.order.amount)) < 0.01;
  const currencyMatches = String(payment.currency).toUpperCase() === loaded.order.currency;
  const succeeded = payment.status === 'success' && amountMatches && currencyMatches;
  if (payment.status !== 'success' && payment.status !== 'failed') return mapOrder(loaded);

  await withTransaction(async (connection) => {
    const [[order]] = await connection.query('SELECT id, status FROM orders WHERE id = ? FOR UPDATE', [loaded.order.id]);
    if (order.status !== 'pending') return;
    const titles = loaded.items.map((item) => item.title).join(', ');
    const total = `${loaded.order.currency} ${Number(loaded.order.amount).toLocaleString('en', { maximumFractionDigits: 2 })}`;
    if (!succeeded) {
      await connection.query(`UPDATE orders SET status = 'failed' WHERE id = ?`, [order.id]);
      await notify(connection, loaded.order.user_id, {
        type: 'payment',
        title: 'Payment not completed',
        body: `Chapa did not confirm a matching payment of ${total} for ${titles}. Your cart is unchanged.`,
        link: '/learn/cart',
      });
      return;
    }
    await connection.query(
      `UPDATE orders SET status = 'paid', paid_at = UTC_TIMESTAMP(), provider_reference = ? WHERE id = ?`,
      [payment.reference ? String(payment.reference).slice(0, 100) : null, order.id],
    );
    for (const item of loaded.items) {
      await grantEnrollment(connection, {
        userId: loaded.order.user_id,
        courseId: item.course_id,
        actorId: loaded.order.user_id,
        details: `${loaded.order.user_name} paid for ${item.title} with Chapa`,
      });
    }
    await notify(connection, loaded.order.user_id, {
      type: 'payment',
      title: 'Payment received',
      body: `You paid ${total} for ${titles}. ${loaded.items.length === 1 ? 'The course is' : 'The courses are'} now in My learning.`,
      link: loaded.items.length === 1
        ? (loaded.items[0].source_slug
          ? `/learn/courses/${loaded.items[0].source_slug}/learn`
          : `/learn/my-courses/${loaded.items[0].course_id}/learn`)
        : '/learn/my-learning',
    });
  });
  return mapOrder(await loadOrder(txRef, userId));
}

/**
 * Courses linked to AilgAdmin are sold through the catalog.
 * Paid EduAdmin courses must go through the cart, not the free enroll button.
 */
export async function assertLocalCourse(courseId) {
  const [rows] = await pool.query('SELECT source_slug, price FROM courses WHERE id = ?', [courseId]);
  if (!rows[0]) throw new AppError(404, 'This course is not available.');
  if (rows[0].source_slug) {
    throw new AppError(402, 'Enroll in this course from its course page.');
  }
  if (Number(rows[0].price) > 0) {
    throw new AppError(402, 'This is a paid course. Add it to your cart and pay with Chapa to enroll.');
  }
}
