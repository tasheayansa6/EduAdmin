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
    JWT_SECRET: z.string().min(16),
    JWT_EXPIRES_IN: z.string().default('8h'),
    CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
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
  },
  jwtSecret: parsed.JWT_SECRET,
  jwtExpiresIn: parsed.JWT_EXPIRES_IN,
  clientOrigin: parsed.CLIENT_ORIGIN,
};
