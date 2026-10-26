import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(root, '.env') });

const parsed = z
  .object({
    PORT: z.coerce.number().default(4000),
    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().default(3306),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),
    // TiDB Cloud / managed MySQL public endpoints require TLS.
    DB_SSL: z
      .string()
      .optional()
      .transform((value) => ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase())),
    JWT_SECRET: z.string().min(16),
    JWT_EXPIRES_IN: z.string().default('8h'),
    CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
    // Comma-separated extra frontends (e.g. Vercel production + alias URLs).
    CLIENT_ORIGINS: z.string().optional().default(''),
    AILG_API_URL: z.string().url().default('http://localhost:4100'),
    AILG_PARTNER_KEY: z.string().optional(),
    CHAPA_SECRET_KEY: z.string().optional(),
    CHAPA_API_URL: z.string().url().default('https://api.chapa.co/v1'),
    API_PUBLIC_URL: z.preprocess((value) => (value === '' ? undefined : value), z.string().url().optional()),
    // Gmail SMTP (use an App Password). Without SMTP_PASS, sends are logged only.
    SMTP_HOST: z.string().optional().default(''),
    SMTP_PORT: z.coerce.number().optional().default(587),
    SMTP_SECURE: z
      .string()
      .optional()
      .transform((value) => ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase())),
    SMTP_USER: z.string().optional().default(''),
    SMTP_PASS: z.string().optional().default(''),
    SMTP_FROM: z.string().optional().default(''),
    // Inbox for career applications, contact messages, and admin test emails.
    MAIL_NOTIFY_TO: z.string().email().optional().default('tasheayansa6@gmail.com'),
  })
  .parse(process.env);

const clientOrigins = [
  parsed.CLIENT_ORIGIN,
  ...String(parsed.CLIENT_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
].filter((value, index, list) => list.indexOf(value) === index);

export const env = {
  port: parsed.PORT,
  db: {
    host: parsed.DB_HOST,
    port: parsed.DB_PORT,
    user: parsed.DB_USER,
    password: parsed.DB_PASSWORD,
    database: parsed.DB_NAME,
    ...(parsed.DB_SSL
      ? {
          ssl: {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true,
          },
        }
      : {}),
  },
  jwtSecret: parsed.JWT_SECRET,
  jwtExpiresIn: parsed.JWT_EXPIRES_IN,
  clientOrigin: clientOrigins[0],
  clientOrigins,
  ailgApiUrl: parsed.AILG_API_URL.replace(/\/+$/, ''),
  ailgPartnerKey: parsed.AILG_PARTNER_KEY?.trim() || null,
  chapa: {
    secretKey: parsed.CHAPA_SECRET_KEY?.trim() || null,
    apiUrl: parsed.CHAPA_API_URL.replace(/\/+$/, ''),
  },
  apiPublicUrl: parsed.API_PUBLIC_URL?.replace(/\/+$/, '') || null,
  smtp: {
    host: parsed.SMTP_HOST?.trim() || '',
    port: parsed.SMTP_PORT,
    secure: Boolean(parsed.SMTP_SECURE),
    user: parsed.SMTP_USER?.trim() || '',
    pass: parsed.SMTP_PASS || '',
    from: parsed.SMTP_FROM?.trim() || '',
  },
  mailNotifyTo: parsed.MAIL_NOTIFY_TO?.trim() || 'tasheayansa6@gmail.com',
};
