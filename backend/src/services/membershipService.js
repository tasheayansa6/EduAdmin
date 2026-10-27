import { pool } from '../db/pool.js';
import { AppError } from '../lib/errors.js';
import { logActivity } from '../lib/activity.js';
import { mailNotifyTo, sendEmail } from '../lib/mailer.js';
import { likeClause, likePattern, toPage } from '../lib/sql.js';

const DEFAULTS = {
  enabled: true,
  eyebrow: 'AILG membership',
  headline: 'Join the membership',
  intro: 'Mentorship, academy access, and field programs from Agricultural Leadership & Investment Group.',
  ctaLabel: 'Join membership',
  ctaUrl: 'https://test.ailgagro.com/#membership',
};

function mapSettings(row) {
  if (!row) return { ...DEFAULTS, updatedAt: null, updatedBy: null };
  return {
    enabled: Boolean(row.enabled),
    eyebrow: row.eyebrow || DEFAULTS.eyebrow,
    headline: row.headline || DEFAULTS.headline,
    intro: row.intro ?? DEFAULTS.intro,
    ctaLabel: row.cta_label || DEFAULTS.ctaLabel,
    ctaUrl: row.cta_url || DEFAULTS.ctaUrl,
    updatedAt: row.updated_at ?? null,
    updatedBy: row.updated_by ?? null,
  };
}

function mapRequest(row) {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    organization: row.organization ?? null,
    message: row.message ?? null,
    status: row.status,
    adminNotes: row.admin_notes ?? null,
    source: row.source || 'admin',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function ensureRow() {
  await pool.query(
    `INSERT INTO membership_settings (id, enabled, eyebrow, headline, intro, cta_label, cta_url)
     VALUES (1, 1, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE id = id`,
    [DEFAULTS.eyebrow, DEFAULTS.headline, DEFAULTS.intro, DEFAULTS.ctaLabel, DEFAULTS.ctaUrl],
  );
}

export async function getMembershipSettings() {
  try {
    await ensureRow();
    const [rows] = await pool.query('SELECT * FROM membership_settings WHERE id = 1');
    return mapSettings(rows[0]);
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') return { ...DEFAULTS, updatedAt: null, updatedBy: null };
    throw error;
  }
}

export async function updateMembershipSettings(actorId, body) {
  await ensureRow();
  const current = await getMembershipSettings();
  const enabled = body.enabled !== undefined ? Boolean(body.enabled) : current.enabled;
  const eyebrow = body.eyebrow !== undefined ? (body.eyebrow || DEFAULTS.eyebrow) : current.eyebrow;
  const headline = body.headline !== undefined ? (body.headline || DEFAULTS.headline) : current.headline;
  const intro = body.intro !== undefined ? body.intro : current.intro;
  const ctaLabel = body.ctaLabel !== undefined ? (body.ctaLabel || DEFAULTS.ctaLabel) : current.ctaLabel;
  const ctaUrl = body.ctaUrl !== undefined ? (body.ctaUrl || DEFAULTS.ctaUrl) : current.ctaUrl;

  await pool.query(
    `UPDATE membership_settings SET
       enabled = ?,
       eyebrow = ?,
       headline = ?,
       intro = ?,
       cta_label = ?,
       cta_url = ?,
       updated_by = ?
     WHERE id = 1`,
    [enabled ? 1 : 0, eyebrow, headline, intro, ctaLabel, ctaUrl, actorId],
  );

  await logActivity(pool, {
    actorId,
    action: 'membership.updated',
    entityType: 'membership',
    entityId: 1,
    details: enabled ? 'Updated membership CTA' : 'Disabled membership CTA',
  });

  return getMembershipSettings();
}

export async function createMembershipRequest(body, { userId = null, source = 'public', actorId = null } = {}) {
  const [result] = await pool.query(
    `INSERT INTO membership_requests
       (user_id, name, email, phone, organization, message, status, source)
     VALUES (?, ?, ?, ?, ?, ?, 'new', ?)`,
    [
      userId,
      body.name,
      body.email,
      body.phone ?? null,
      body.organization ?? null,
      body.message ?? null,
      source,
    ],
  );

  await logActivity(pool, {
    actorId: actorId || userId || null,
    action: 'membership.request_received',
    entityType: 'membership_request',
    entityId: result.insertId,
    details: `${body.name} requested membership`,
  });

  try {
    await sendEmail({
      to: mailNotifyTo(),
      replyTo: body.email,
      subject: `Membership request: ${body.name}`,
      text: [
        'New AILG membership request',
        '',
        `Name: ${body.name}`,
        `Email: ${body.email}`,
        `Phone: ${body.phone || '—'}`,
        `Organization: ${body.organization || '—'}`,
        `Source: ${source}`,
        '',
        body.message || '(No message)',
      ].join('\n'),
    });
  } catch (error) {
    console.warn('[membership] notify email failed:', error.message);
  }

  const [rows] = await pool.query('SELECT * FROM membership_requests WHERE id = ?', [result.insertId]);
  return mapRequest(rows[0]);
}

export async function listMembershipRequests(query) {
  const where = ['1=1'];
  const params = [];
  if (query.q) {
    where.push(`(${likeClause('name')} OR ${likeClause('email')} OR ${likeClause('organization')})`);
    const pattern = likePattern(query.q);
    params.push(pattern, pattern, pattern);
  }
  if (query.status) {
    where.push('status = ?');
    params.push(query.status);
  }
  const clause = where.join(' AND ');
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM membership_requests WHERE ${clause}`,
    params,
  );
  const offset = (query.page - 1) * query.limit;
  const [rows] = await pool.query(
    `SELECT * FROM membership_requests
     WHERE ${clause}
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...params, query.limit, offset],
  );
  return toPage(rows.map(mapRequest), Number(countRows[0].total), query.page, query.limit);
}

export async function updateMembershipRequest(actorId, id, body) {
  const [rows] = await pool.query('SELECT * FROM membership_requests WHERE id = ?', [id]);
  if (!rows[0]) throw new AppError(404, 'Membership request not found.');

  const status = body.status !== undefined ? body.status : rows[0].status;
  const adminNotes = body.adminNotes !== undefined ? body.adminNotes : rows[0].admin_notes;

  await pool.query(
    `UPDATE membership_requests SET status = ?, admin_notes = ? WHERE id = ?`,
    [status, adminNotes, id],
  );

  await logActivity(pool, {
    actorId,
    action: 'membership.request_updated',
    entityType: 'membership_request',
    entityId: id,
    details: `Marked membership request as ${status}`,
  });

  const [updated] = await pool.query('SELECT * FROM membership_requests WHERE id = ?', [id]);
  return mapRequest(updated[0]);
}

export async function deleteMembershipRequest(actorId, id) {
  const [rows] = await pool.query('SELECT * FROM membership_requests WHERE id = ?', [id]);
  if (!rows[0]) throw new AppError(404, 'Membership request not found.');
  await pool.query('DELETE FROM membership_requests WHERE id = ?', [id]);
  await logActivity(pool, {
    actorId,
    action: 'membership.request_deleted',
    entityType: 'membership_request',
    entityId: id,
    details: `Deleted membership request from ${rows[0].name}`,
  });
}

export async function membershipRequestStats() {
  const [[row]] = await pool.query(
    `SELECT
       SUM(status = 'new') AS new_count,
       SUM(status = 'reviewing') AS reviewing_count,
       SUM(status = 'approved') AS approved_count,
       SUM(status = 'rejected') AS rejected_count,
       COUNT(*) AS total
     FROM membership_requests`,
  );
  return {
    new: Number(row?.new_count || 0),
    reviewing: Number(row?.reviewing_count || 0),
    approved: Number(row?.approved_count || 0),
    rejected: Number(row?.rejected_count || 0),
    total: Number(row?.total || 0),
  };
}
