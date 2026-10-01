import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { healthResponseSchema } from '@pba/shared';
import { profileErrorStatus, profileRouter } from './profileRoutes.js';
import { resumeErrorStatus, resumeRouter } from './resumeRoutes.js';
import { applicationErrorStatus, applicationRouter } from './applicationRoutes.js';
import { jobErrorStatus, jobRouter } from './jobRoutes.js';

export function getHealthResponse() {
  return healthResponseSchema.parse({ status: 'ok', service: 'personal-brand-assistant-api', timestamp: new Date().toISOString() });
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  const allowedOrigins = (process.env.WEB_ORIGINS ?? process.env.WEB_ORIGIN ?? 'http://localhost:5173').split(',').map(origin => origin.trim()).filter(Boolean);
  app.use(cors({ origin: (origin, callback) => { if (!origin || allowedOrigins.includes(origin)) callback(null, true); else callback(new Error('Origin is not allowed by the API CORS policy.')); } }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_request, response) => {
    response.json(getHealthResponse());
  });
  app.use('/api/profile', profileRouter);
  app.use('/api/resumes', resumeRouter);
  app.use('/api/jobs', jobRouter);
  app.use('/api/applications', applicationRouter);

  app.use((_request, response) => response.status(404).json({ error: 'Not found' }));
  const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    const profileStatus = profileErrorStatus(error);
    const resumeStatus = resumeErrorStatus(error);
    const jobStatus = jobErrorStatus(error);
    const applicationStatus = applicationErrorStatus(error);
    const status = [profileStatus, resumeStatus, jobStatus, applicationStatus].find(candidate => candidate !== 500) ?? 500;
    if (status >= 500) console.error(error);
    response.status(status).json({ error: status === 500 ? 'Internal server error' : error instanceof Error ? error.message : 'Invalid request' });
  };
  app.use(errorHandler);
  return app;
}
