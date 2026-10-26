import { pool } from '../db/pool.js';
import { AppError } from '../lib/errors.js';
import { logActivity } from '../lib/activity.js';
import { mailConfigured, sendEmail } from '../lib/mailer.js';
import { likeClause, likePattern, toPage } from '../lib/sql.js';

function mapSub(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    status: row.status,
    source: row.source,
    userId: row.user_id ?? null,
    subscribedAt: row.subscribed_at,
    unsubscribedAt: row.unsubscribed_at ?? null,
  };
}

function mapCampaign(row) {
  return {
    id: row.id,
    subject: row.subject,
    body: row.body,
    recipientCount: Number(row.recipient_count) || 0,
    deliveredCount: Number(row.delivered_count) || 0,
    failedCount: Number(row.failed_count) || 0,
    deliveryMode: row.delivery_mode,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
  };
}

export async function subscribe({ email, name = null, source = 'web', userId = null }) {
  const normalized = String(email).trim().toLowerCase();
  const [existing] = await pool.query('SELECT * FROM subscriptions WHERE email = ?', [normalized]);
  if (existing[0]) {
    if (existing[0].status === 'active') {
      return mapSub(existing[0]);
    }
    await pool.query(
      `UPDATE subscriptions
       SET status = 'active', name = COALESCE(?, name), source = ?, user_id = COALESCE(?, user_id),
           unsubscribed_at = NULL, subscribed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, source, userId, existing[0].id],
    );
    const [rows] = await pool.query('SELECT * FROM subscriptions WHERE id = ?', [existing[0].id]);
    return mapSub(rows[0]);
  }

  const [result] = await pool.query(
    `INSERT INTO subscriptions (email, name, status, source, user_id)
     VALUES (?, ?, 'active', ?, ?)`,
    [normalized, name, source, userId],
  );
  const [rows] = await pool.query('SELECT * FROM subscriptions WHERE id = ?', [result.insertId]);
  return mapSub(rows[0]);
}

export async function unsubscribe(email) {
  const normalized = String(email).trim().toLowerCase();
  const [result] = await pool.query(
    `UPDATE subscriptions
     SET status = 'unsubscribed', unsubscribed_at = CURRENT_TIMESTAMP
     WHERE email = ? AND status = 'active'`,
    [normalized],
  );
  if (!result.affectedRows) throw new AppError(404, 'Subscription not found.');
  return { email: normalized, status: 'unsubscribed' };
}

export async function listSubscriptions(query) {
  const where = ['1=1'];
  const params = [];
  if (query.q) {
    where.push(`(${likeClause('email')} OR ${likeClause('name')})`);
    const pattern = likePattern(query.q);
    params.push(pattern, pattern);
  }
  if (query.status) {
    where.push('status = ?');
    params.push(query.status);
  }
  const clause = where.join(' AND ');
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM subscriptions WHERE ${clause}`, params);
  const offset = (query.page - 1) * query.limit;
  const [rows] = await pool.query(
    `SELECT * FROM subscriptions
     WHERE ${clause}
     ORDER BY subscribed_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...params, query.limit, offset],
  );
  return toPage(rows.map(mapSub), Number(countRows[0].total), query.page, query.limit);
}

export async function setSubscriptionStatus(actorId, id, status) {
  const [rows] = await pool.query('SELECT * FROM subscriptions WHERE id = ?', [id]);
  if (!rows[0]) throw new AppError(404, 'Subscriber not found.');
  await pool.query(
    `UPDATE subscriptions
     SET status = ?, unsubscribed_at = IF(? = 'unsubscribed', CURRENT_TIMESTAMP, NULL)
     WHERE id = ?`,
    [status, status, id],
  );
  await logActivity(pool, {
    actorId,
    action: status === 'active' ? 'subscription.reactivated' : 'subscription.unsubscribed',
    entityType: 'subscription',
    entityId: id,
    details: `${status === 'active' ? 'Reactivated' : 'Unsubscribed'} ${rows[0].email}`,
  });
  const [updated] = await pool.query('SELECT * FROM subscriptions WHERE id = ?', [id]);
  return mapSub(updated[0]);
}

export async function deleteSubscription(actorId, id) {
  const [rows] = await pool.query('SELECT * FROM subscriptions WHERE id = ?', [id]);
  if (!rows[0]) throw new AppError(404, 'Subscriber not found.');
  await pool.query('DELETE FROM subscriptions WHERE id = ?', [id]);
  await logActivity(pool, {
    actorId,
    action: 'subscription.deleted',
    entityType: 'subscription',
    entityId: id,
    details: `Removed subscriber ${rows[0].email}`,
  });
  return { id, deleted: true };
}

export async function listCampaigns(query) {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM subscription_campaigns');
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `SELECT * FROM subscription_campaigns
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  return toPage(rows.map(mapCampaign), Number(countRows[0].total), page, limit);
}

/** Sends a campaign to every active subscriber email. */
export async function sendCampaign(actorId, { subject, body }) {
  const [subscribers] = await pool.query(
    `SELECT id, email, name FROM subscriptions WHERE status = 'active' ORDER BY id ASC`,
  );
  if (!subscribers.length) {
    throw new AppError(400, 'No active subscribers to email yet.');
  }

  const mode = mailConfigured() ? 'smtp' : 'log';
  const [campaignResult] = await pool.query(
    `INSERT INTO subscription_campaigns
       (subject, body, recipient_count, delivered_count, failed_count, delivery_mode, created_by)
     VALUES (?, ?, ?, 0, 0, ?, ?)`,
    [subject, body, subscribers.length, mode, actorId],
  );
  const campaignId = campaignResult.insertId;

  let delivered = 0;
  let failed = 0;
  for (const sub of subscribers) {
    const greeting = sub.name ? `Hi ${sub.name},` : 'Hello,';
    const text = `${greeting}\n\n${body}\n\n— EduAdmin\nUnsubscribe: reply to this email or contact support.`;
    try {
      const result = await sendEmail({ to: sub.email, subject, text });
      await pool.query(
        `INSERT INTO subscription_deliveries (campaign_id, subscription_id, email, status)
         VALUES (?, ?, ?, ?)`,
        [campaignId, sub.id, sub.email, result.mode === 'smtp' ? 'sent' : 'logged'],
      );
      delivered += 1;
    } catch (error) {
      failed += 1;
      await pool.query(
        `INSERT INTO subscription_deliveries (campaign_id, subscription_id, email, status, error_message)
         VALUES (?, ?, ?, 'failed', ?)`,
        [campaignId, sub.id, sub.email, String(error.message || 'Send failed').slice(0, 500)],
      );
    }
  }

  await pool.query(
    `UPDATE subscription_campaigns SET delivered_count = ?, failed_count = ? WHERE id = ?`,
    [delivered, failed, campaignId],
  );
  await logActivity(pool, {
    actorId,
    action: 'subscription.campaign_sent',
    entityType: 'subscription_campaign',
    entityId: campaignId,
    details: `Emailed “${subject}” to ${delivered}/${subscribers.length} subscribers (${mode})`,
  });

  const [rows] = await pool.query('SELECT * FROM subscription_campaigns WHERE id = ?', [campaignId]);
  return {
    ...mapCampaign(rows[0]),
    mailConfigured: mailConfigured(),
  };
}

export async function subscriptionStats() {
  const [[row]] = await pool.query(
    `SELECT
       SUM(status = 'active') AS active_count,
       SUM(status = 'unsubscribed') AS unsubscribed_count,
       COUNT(*) AS total
     FROM subscriptions`,
  );
  return {
    active: Number(row.active_count) || 0,
    unsubscribed: Number(row.unsubscribed_count) || 0,
    total: Number(row.total) || 0,
    mailConfigured: mailConfigured(),
  };
}
