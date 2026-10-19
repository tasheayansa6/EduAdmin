import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { registerRoutes } from './routes/index.js';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin }));
  app.use(express.json({ limit: '1mb' }));
  registerRoutes(app);
  app.use('/api', notFound);
  app.use(errorHandler);
  return app;
}
