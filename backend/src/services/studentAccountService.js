import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../db/pool.js';
import { logActivity } from '../lib/activity.js';
import { AppError } from '../lib/errors.js';
import { notify } from '../lib/notify.js';

function splitName(name) {
  const parts = String(name).trim().split(/\s+/);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
}

function mapProfile(user, row) {
  const fallback = splitName(user.name);
  return {
    name: user.name,
    email: user.email,
    memberSince: user.created_at,
    firstName: row?.first_name ?? fallback.firstName,
    lastName: row?.last_name ?? fallback.lastName,
    headline: row?.headline ?? null,
    biography: row?.biography ?? null,
    language: row?.language ?? 'en',
    website: row?.website ?? null,
    facebook: row?.facebook ?? null,
    instagram: row?.instagram ?? null,
    linkedin: row?.linkedin ?? null,
    tiktok: row?.tiktok ?? null,
    x: row?.x_username ?? null,
    youtube: row?.youtube ?? null,
  };
}

export async function getStudentProfile(userId) {
  const [[user]] = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = ?', [userId]);
  const [[row]] = await pool.query('SELECT * FROM student_profiles WHERE user_id = ?', [userId]);
  return mapProfile(user, row);
}

/** Saves the public profile. The account name becomes "first last" so admins see the same name. */
export async function updateStudentProfile(userId, profile) {
  const name = `${profile.firstName} ${profile.lastName}`.trim();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('UPDATE users SET name = ? WHERE id = ?', [name, userId]);
    await connection.query(
      `INSERT INTO student_profiles
         (user_id, first_name, last_name, headline, biography, language, website, facebook, instagram, linkedin, tiktok, x_username, youtube)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name), headline = VALUES(headline),
         biography = VALUES(biography), language = VALUES(language), website = VALUES(website), facebook = VALUES(facebook),
         instagram = VALUES(instagram), linkedin = VALUES(linkedin), tiktok = VALUES(tiktok), x_username = VALUES(x_username),
         youtube = VALUES(youtube)`,
      [
        userId, profile.firstName, profile.lastName, profile.headline, profile.biography, profile.language,
        profile.website, profile.facebook, profile.instagram, profile.linkedin, profile.tiktok, profile.x, profile.youtube,
      ],
    );
    await logActivity(connection, { actorId: userId, action: 'profile.updated', entityType: 'user', entityId: userId, details: 'Updated public profile' });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return getStudentProfile(userId);
}

/** Changes the password and signs out every other session; returns a fresh token for this one. */
export async function changePassword(userId, currentPassword, newPassword) {
  const [[user]] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
  if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
    throw new AppError(400, 'Your current password is incorrect.', [{ field: 'currentPassword', message: 'Your current password is incorrect.' }]);
  }
  const hash = await bcrypt.hash(newPassword, 10);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('UPDATE users SET password_hash = ?, session_version = session_version + 1 WHERE id = ?', [hash, userId]);
    await logActivity(connection, { actorId: userId, action: 'password.changed', entityType: 'user', entityId: userId, details: 'Changed password' });
    await notify(connection, userId, {
      type: 'security',
      title: 'Your password was changed',
      body: 'You were signed out on other devices. If this was not you, contact an administrator straight away.',
      link: '/learn/profile/security',
    });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  const [[fresh]] = await pool.query('SELECT session_version FROM users WHERE id = ?', [userId]);
  return { token: jwt.sign({ sub: userId, sv: fresh.session_version }, env.jwtSecret, { expiresIn: env.jwtExpiresIn }) };
}

function mapNotification(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    read: Boolean(row.read_at),
    createdAt: row.created_at,
  };
}

export async function listNotifications(userId, limit) {
  const [rows] = await pool.query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?',
    [userId, limit],
  );
  const [[count]] = await pool.query('SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND read_at IS NULL', [userId]);
  return { items: rows.map(mapNotification), unread: Number(count.unread) };
}

/** Marks the given notifications (or all of them) as read. Only touches the caller's own rows. */
export async function markNotificationsRead(userId, ids) {
  if (ids?.length) {
    await pool.query('UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND id IN (?) AND read_at IS NULL', [userId, ids]);
  } else {
    await pool.query('UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND read_at IS NULL', [userId]);
  }
  return listNotifications(userId, 20);
}
