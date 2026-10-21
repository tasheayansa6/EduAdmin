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
    AILG_API_URL: z.string().url().default('http://localhost:4100'),
    AILG_PARTNER_KEY: z.string().optional(),
    CHAPA_SECRET_KEY: z.string().optional(),
    CHAPA_API_URL: z.string().url().default('https://api.chapa.co/v1'),
    API_PUBLIC_URL: z.preprocess((value) => (value === '' ? undefined : value), z.string().url().optional()),
  })
  .parse(process.env);

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
  clientOrigin: parsed.CLIENT_ORIGIN,
  ailgApiUrl: parsed.AILG_API_URL.replace(/\/+$/, ''),
  ailgPartnerKey: parsed.AILG_PARTNER_KEY?.trim() || null,
  chapa: {
    secretKey: parsed.CHAPA_SECRET_KEY?.trim() || null,
    apiUrl: parsed.CHAPA_API_URL.replace(/\/+$/, ''),
  },
  apiPublicUrl: parsed.API_PUBLIC_URL?.replace(/\/+$/, '') || null,
};
