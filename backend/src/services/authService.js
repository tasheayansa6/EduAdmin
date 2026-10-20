import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../db/pool.js';
import { AppError } from '../lib/errors.js';
import { logActivity } from '../lib/activity.js';
import { notify } from '../lib/notify.js';

/** Valid bcrypt hash used only so missing users still run a compare (timing). */
const DUMMY_PASSWORD_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

function toPublic(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
  };
}

export async function login(email, password) {
  const [rows] = await pool.query(
    `SELECT id, name, email, password_hash, role, status, session_version
     FROM users WHERE email = ?`,
    [email],
  );
  const user = rows[0];
  const matches = await bcrypt.compare(password, user?.password_hash || DUMMY_PASSWORD_HASH);

  // Same message for unknown email and wrong password — do not reveal which failed.
  if (!user || !matches) {
    throw new AppError(401, 'Email or password is incorrect.');
  }
  if (user.status !== 'active') {
    throw new AppError(403, 'This account is inactive. Contact an administrator.');
  }

  const token = jwt.sign(
    { sub: user.id, sv: user.session_version },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

  return { token, user: toPublic(user) };
}

export async function registerStudent({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES (?, ?, ?, 'student', 'active')`,
      [name, email, passwordHash],
    );
    await logActivity(pool, {
      actorId: result.insertId,
      action: 'student.registered',
      entityType: 'user',
      entityId: result.insertId,
      details: 'Student account created',
    });
    await notify(pool, result.insertId, {
      type: 'welcome',
      title: 'Welcome to EduAdmin Learning',
      body: 'Explore the courses and tap the heart on the ones you like to save them.',
      link: '/learn/courses',
    });
    return login(email, password);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'That email address is already in use.', [
        { field: 'email', message: 'That email address is already in use.' },
      ]);
    }
    throw error;
  }
}

export async function getSessionUser(id) {
  const [rows] = await pool.query(
    `SELECT id, name, email, role, status, session_version
     FROM users
     WHERE id = ? AND status = 'active'`,
    [id],
  );
  const user = rows[0];
  if (!user) return null;
  return { ...toPublic(user), sessionVersion: user.session_version };
}

export async function updateProfile(userId, name) {
  await pool.query('UPDATE users SET name = ? WHERE id = ?', [name, userId]);
  await logActivity(pool, {
    actorId: userId,
    action: 'profile.updated',
    entityType: 'user',
    entityId: userId,
    details: 'Updated profile name',
  });
  const user = await getSessionUser(userId);
  return toPublic(user);
}

export async function logout(userId) {
  await pool.query(
    'UPDATE users SET session_version = session_version + 1 WHERE id = ?',
    [userId],
  );
}
