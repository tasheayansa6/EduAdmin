import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { registerRoutes } from './routes/index.js';

export function createApp() {
  const app = express();
  app.use(helmet({
    // API JSON is fetched by the Vercel SPA; allow same-site clients.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.use(cors({
    origin(origin, callback) {
      if (!origin || env.clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));
  registerRoutes(app);
  app.use('/api', notFound);
  app.use(errorHandler);
  return app;
}
