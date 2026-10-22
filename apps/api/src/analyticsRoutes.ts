import { Router, type Request } from 'express';
import { authenticateRequest } from './auth.js';
import { analyticsErrorStatus, ingestAnalyticsEvent, ingestMetricSnapshot, listMetrics } from './analyticsService.js';
export const analyticsRouter = Router(); const identity = (request: Request) => authenticateRequest(request);
analyticsRouter.get('/metrics', async (req, res) => res.json({ metrics: await listMetrics(identity(req).userId, typeof req.query.publishedPostId === 'string' ? req.query.publishedPostId : undefined) }));
analyticsRouter.post('/events', async (req, res) => res.status(201).json(await ingestAnalyticsEvent(identity(req).userId, req.body)));
analyticsRouter.post('/metrics', async (req, res) => res.status(201).json(await ingestMetricSnapshot(identity(req).userId, req.body)));
export { analyticsErrorStatus };
