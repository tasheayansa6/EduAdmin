import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';
import { AppError } from '../lib/errors.js';
import { logActivity } from '../lib/activity.js';

function mapAdmin(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function listAdmins() {
  const [rows] = await pool.query(
    `SELECT id, name, email, role, status, created_at
     FROM users
     WHERE role IN ('admin', 'super_admin')
     ORDER BY role ASC, name ASC`,
  );
  return rows.map(mapAdmin);
}

export async function createAdmin(actorId, body) {
  const passwordHash = await bcrypt.hash(body.password, 10);
  try {
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES (?, ?, ?, 'admin', 'active')`,
      [body.name, body.email, passwordHash],
    );
    await logActivity(pool, {
      actorId,
      action: 'admin.created',
      entityType: 'user',
      entityId: result.insertId,
      details: `Added administrator ${body.name}`,
    });
    const [rows] = await pool.query(
      `SELECT id, name, email, role, status, created_at FROM users WHERE id = ?`,
      [result.insertId],
    );
    return mapAdmin(rows[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'That email address is already in use.', [
        { field: 'email', message: 'That email address is already in use.' },
      ]);
    }
    throw error;
  }
}

export async function updateAdminStatus(actorId, id, status) {
  if (actorId === id) {
    throw new AppError(400, 'You cannot change your own access.');
  }
  const [rows] = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ? AND role IN ('admin', 'super_admin')`,
    [id],
  );
  const account = rows[0];
  if (!account) throw new AppError(404, 'Administrator not found.');
  if (account.role === 'super_admin') {
    throw new AppError(403, 'Super administrator access cannot be changed here.');
  }

  await pool.query(
    `UPDATE users SET status = ?, session_version = session_version + 1 WHERE id = ?`,
    [status, id],
  );
  await logActivity(pool, {
    actorId,
    action: 'admin.updated',
    entityType: 'user',
    entityId: id,
    details: `${status === 'active' ? 'Activated' : 'Deactivated'} ${account.name}`,
  });
}
