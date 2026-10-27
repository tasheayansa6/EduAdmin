import { pool } from '../db/pool.js';
import { logActivity } from '../lib/activity.js';

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
