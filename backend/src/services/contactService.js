import { pool } from '../db/pool.js';
import { AppError } from '../lib/errors.js';
import { logActivity } from '../lib/activity.js';
import { mailNotifyTo, sendEmail } from '../lib/mailer.js';
import { likeClause, likePattern, toPage } from '../lib/sql.js';

const DEFAULTS = {
  organizationName: 'EduAdmin Learning',
  headline: 'Contact us',
  intro: 'Questions about courses, enrollments, or your account? Reach the learning team using the details below or send a message.',
  email: 'tasheayansa6@gmail.com',
  phone: '+251 11 000 0000',
  whatsapp: null,
  telegram: null,
  addressLine: null,
  city: null,
  region: null,
  country: null,
  hours: 'Mon–Fri, 9:00–17:00 EAT',
  mapUrl: null,
};

function mapInfo(row) {
  if (!row) return { ...DEFAULTS, updatedAt: null, updatedBy: null };
  return {
    organizationName: row.organization_name,
    headline: row.headline ?? null,
    intro: row.intro ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    whatsapp: row.whatsapp ?? null,
    telegram: row.telegram ?? null,
    addressLine: row.address_line ?? null,
    city: row.city ?? null,
    region: row.region ?? null,
    country: row.country ?? null,
    hours: row.hours ?? null,
    mapUrl: row.map_url ?? null,
    updatedAt: row.updated_at ?? null,
    updatedBy: row.updated_by ?? null,
  };
}

function mapMessage(row) {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    name: row.name,
    email: row.email,
    subject: row.subject,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function ensureContactRow() {
  await pool.query(
    `INSERT INTO contact_info (id, organization_name, headline, intro, email, phone, hours)
     VALUES (1, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE id = id`,
    [
      DEFAULTS.organizationName,
      DEFAULTS.headline,
      DEFAULTS.intro,
      DEFAULTS.email,
      DEFAULTS.phone,
      DEFAULTS.hours,
    ],
  );
}

export async function getContactInfo() {
  try {
    await ensureContactRow();
    const [rows] = await pool.query('SELECT * FROM contact_info WHERE id = 1');
    return mapInfo(rows[0]);
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') return { ...DEFAULTS, updatedAt: null, updatedBy: null };
    throw error;
  }
}

export async function updateContactInfo(actorId, body) {
  await ensureContactRow();
  await pool.query(
    `UPDATE contact_info SET
       organization_name = ?,
       headline = ?,
       intro = ?,
       email = ?,
       phone = ?,
       whatsapp = ?,
       telegram = ?,
       address_line = ?,
       city = ?,
       region = ?,
       country = ?,
       hours = ?,
       map_url = ?,
       updated_by = ?
     WHERE id = 1`,
    [
      body.organizationName,
      body.headline ?? null,
      body.intro ?? null,
      body.email ?? null,
      body.phone ?? null,
      body.whatsapp ?? null,
      body.telegram ?? null,
      body.addressLine ?? null,
      body.city ?? null,
      body.region ?? null,
      body.country ?? null,
      body.hours ?? null,
      body.mapUrl ?? null,
      actorId,
    ],
  );
  await logActivity(pool, {
    actorId,
    action: 'contact.updated',
    entityType: 'contact',
    entityId: 1,
    details: 'Updated Contact Us information',
  });
  return getContactInfo();
}

export async function createContactMessage(userId, body) {
  const [result] = await pool.query(
    `INSERT INTO contact_messages (user_id, name, email, subject, body, status)
     VALUES (?, ?, ?, ?, ?, 'new')`,
    [userId || null, body.name, body.email, body.subject, body.body],
  );
  const [rows] = await pool.query('SELECT * FROM contact_messages WHERE id = ?', [result.insertId]);
  const message = mapMessage(rows[0]);

  await logActivity(pool, {
    actorId: userId || null,
    action: 'contact.message_received',
    entityType: 'contact_message',
    entityId: result.insertId,
    details: `${body.name}: ${body.subject}`,
  });

  const info = await getContactInfo().catch(() => ({ email: mailNotifyTo() }));
  const notifyTo = info.email || mailNotifyTo();
  try {
    await sendEmail({
      to: notifyTo,
      replyTo: body.email,
      subject: `Contact Us: ${body.subject}`,
      text: [
        'New Contact Us message from EduAdmin',
        '',
        `Name: ${body.name}`,
        `Email: ${body.email}`,
        `Subject: ${body.subject}`,
        '',
        body.body,
      ].join('\n'),
    });
  } catch (error) {
    console.warn('[contact] notify email failed:', error.message);
  }

  return message;
}

export async function listContactMessages(query) {
  const where = ['1=1'];
  const params = [];
  if (query.q) {
    where.push(`(${likeClause('name')} OR ${likeClause('email')} OR ${likeClause('subject')} OR ${likeClause('body')})`);
    const pattern = likePattern(query.q);
    params.push(pattern, pattern, pattern, pattern);
  }
  if (query.status) {
    where.push('status = ?');
    params.push(query.status);
  }
  const clause = where.join(' AND ');
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM contact_messages WHERE ${clause}`, params);
  const offset = (query.page - 1) * query.limit;
  const [rows] = await pool.query(
    `SELECT * FROM contact_messages
     WHERE ${clause}
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...params, query.limit, offset],
  );
  return toPage(rows.map(mapMessage), Number(countRows[0].total), query.page, query.limit);
}

export async function updateContactMessageStatus(actorId, id, status) {
  const [rows] = await pool.query('SELECT * FROM contact_messages WHERE id = ?', [id]);
  if (!rows[0]) throw new AppError(404, 'Contact message not found.');
  await pool.query('UPDATE contact_messages SET status = ? WHERE id = ?', [status, id]);
  await logActivity(pool, {
    actorId,
    action: 'contact.message_updated',
    entityType: 'contact_message',
    entityId: id,
    details: `Marked contact message as ${status}`,
  });
  const [updated] = await pool.query('SELECT * FROM contact_messages WHERE id = ?', [id]);
  return mapMessage(updated[0]);
}

export async function deleteContactMessage(actorId, id) {
  const [rows] = await pool.query('SELECT * FROM contact_messages WHERE id = ?', [id]);
  if (!rows[0]) throw new AppError(404, 'Contact message not found.');
  await pool.query('DELETE FROM contact_messages WHERE id = ?', [id]);
  await logActivity(pool, {
    actorId,
    action: 'contact.message_deleted',
    entityType: 'contact_message',
    entityId: id,
    details: `Deleted contact message from ${rows[0].name}`,
  });
  return { id, deleted: true };
}
