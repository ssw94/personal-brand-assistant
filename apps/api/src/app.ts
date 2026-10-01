import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { healthResponseSchema } from '@pba/shared';
import { profileErrorStatus, profileRouter } from './profileRoutes.js';

export function getHealthResponse() {
  return healthResponseSchema.parse({ status: 'ok', service: 'personal-brand-assistant-api', timestamp: new Date().toISOString() });
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173' }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_request, response) => {
    response.json(getHealthResponse());
  });
  app.use('/api/profile', profileRouter);

  app.use((_request, response) => response.status(404).json({ error: 'Not found' }));
  const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    const status = profileErrorStatus(error);
    if (status >= 500) console.error(error);
    response.status(status).json({ error: status === 500 ? 'Internal server error' : error instanceof Error ? error.message : 'Invalid request' });
  };
  app.use(errorHandler);
  return app;
}
