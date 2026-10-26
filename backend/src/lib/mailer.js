import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

/** True only when host/from/user/pass are all set (ready for live Gmail delivery). */
export function mailConfigured() {
  return Boolean(
    env.smtp?.host
    && env.smtp?.from
    && env.smtp?.user
    && env.smtp?.pass,
  );
}

export function mailNotifyTo() {
  return env.mailNotifyTo || 'tasheayansa6@gmail.com';
}

function getTransporter() {
  if (!mailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure || env.smtp.port === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
  }
  return transporter;
}

/**
 * Sends one email when SMTP is fully configured; otherwise logs and returns mode "log".
 */
export async function sendEmail({ to, subject, text, html, replyTo }) {
  const from = env.smtp?.from || `EduAdmin <${mailNotifyTo()}>`;
  const transport = getTransporter();
  if (!transport) {
    console.info(`[mail:log] to=${to} subject=${subject}`);
    return { mode: 'log', messageId: null, to };
  }
  const info = await transport.sendMail({
    from,
    to,
    subject,
    text,
    html: html || undefined,
    replyTo: replyTo || undefined,
  });
  return { mode: 'smtp', messageId: info.messageId || null, to };
}

/** Verifies SMTP credentials (admin test). */
export async function verifyMailer() {
  if (!mailConfigured()) {
    return {
      ok: false,
      configured: false,
      notifyTo: mailNotifyTo(),
      message: 'SMTP is incomplete. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM in backend/.env (Gmail App Password).',
    };
  }
  const transport = getTransporter();
  await transport.verify();
  return {
    ok: true,
    configured: true,
    notifyTo: mailNotifyTo(),
    host: env.smtp.host,
    user: env.smtp.user,
    message: 'SMTP connection verified.',
  };
}
