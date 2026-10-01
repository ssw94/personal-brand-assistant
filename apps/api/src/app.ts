import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { healthResponseSchema } from '@pba/shared';
import { profileErrorStatus, profileRouter } from './profileRoutes.js';
import { resumeErrorStatus, resumeRouter } from './resumeRoutes.js';
import { applicationErrorStatus, applicationRouter, interviewPreparationErrorStatus } from './applicationRoutes.js';
import { jobErrorStatus, jobRouter } from './jobRoutes.js';
import { applicationPackageErrorStatus, applicationPackageRouter } from './applicationPackageRoutes.js';
import { careerAssistantErrorStatus, careerAssistantRouter } from './careerAssistantRoutes.js';
import { authenticationErrorStatus } from './auth.js';
import { createRateLimiter } from './rateLimit.js';
import { contentErrorStatus, contentRouter } from './contentRoutes.js';
import { authRouter, authServiceErrorStatus } from './authRoutes.js';

export function getHealthResponse() {
  return healthResponseSchema.parse({ status: 'ok', service: 'personal-brand-assistant-api', timestamp: new Date().toISOString() });
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
  const configuredOrigins = (process.env.WEB_ORIGINS ?? process.env.WEB_ORIGIN ?? '').split(',').map(origin => origin.trim()).filter(Boolean);
  const allowedOrigins = configuredOrigins.length ? configuredOrigins : process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173'];
  app.use((request, response, next) => { response.setHeader('X-Content-Type-Options', 'nosniff'); response.setHeader('X-Frame-Options', 'DENY'); response.setHeader('Referrer-Policy', 'no-referrer'); response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'"); if (process.env.NODE_ENV === 'production') response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains'); next(); });
  app.use(cors({ origin: (origin, callback) => { if (!origin || allowedOrigins.includes(origin)) callback(null, true); else { const error = new Error('Origin is not allowed by the API CORS policy.'); error.name = 'CorsPolicyError'; callback(error); } } }));
  app.use(express.json({ limit: '256kb' }));
  app.use('/api', createRateLimiter(120, 60_000));
  app.use('/api/assistant', createRateLimiter(20, 60_000));
  app.use('/api/content', createRateLimiter(30, 60_000));
  app.use('/api/auth', createRateLimiter(20, 60_000));
  app.use('/api/application-packages', createRateLimiter(20, 60_000));
  app.use('/api/resumes', createRateLimiter(30, 60_000));

  app.get('/api/health', (_request, response) => {
    response.json(getHealthResponse());
  });
  app.use('/api/auth', authRouter);
  app.use('/api/profile', profileRouter);
  app.use('/api/resumes', resumeRouter);
  app.use('/api/jobs', jobRouter);
  app.use('/api/applications', applicationRouter);
  app.use('/api/application-packages', applicationPackageRouter);
  app.use('/api/assistant', careerAssistantRouter);
  app.use('/api/content', contentRouter);

  app.use((_request, response) => response.status(404).json({ error: 'Not found' }));
  const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    const profileStatus = profileErrorStatus(error);
    const resumeStatus = resumeErrorStatus(error);
    const jobStatus = jobErrorStatus(error);
    const applicationStatus = applicationErrorStatus(error);
    const interviewStatus = interviewPreparationErrorStatus(error);
    const packageStatus = applicationPackageErrorStatus(error);
    const assistantStatus = careerAssistantErrorStatus(error);
    const contentStatus = contentErrorStatus(error);
    const authServiceStatus = authServiceErrorStatus(error);
    const authStatus = authenticationErrorStatus(error);
    const corsStatus = error instanceof Error && error.name === 'CorsPolicyError' ? 403 : 500;
    const requestStatus = typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number' && error.status >= 400 && error.status < 500 ? error.status : 500;
    const status = [profileStatus, resumeStatus, jobStatus, applicationStatus, interviewStatus, packageStatus, assistantStatus, contentStatus, authServiceStatus, authStatus, corsStatus, requestStatus].find(candidate => candidate !== 500) ?? 500;
    if (status >= 500) console.error(error);
    response.status(status).json({ error: status === 500 ? 'Internal server error' : error instanceof Error ? error.message : 'Invalid request' });
  };
  app.use(errorHandler);
  return app;
}
