import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { healthResponseSchema } from '@pba/shared';

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

  app.use((_request, response) => response.status(404).json({ error: 'Not found' }));
  const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ error: 'Internal server error' });
  };
  app.use(errorHandler);
  return app;
}
