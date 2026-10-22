import { Router, type Request } from 'express';
import { authenticateRequest } from './auth.js';
import { decideInsight, generateAnalyticsInsights, intelligenceErrorStatus, listInsights } from './analyticsIntelligenceService.js';
export const analyticsIntelligenceRouter = Router(); const identity = (request: Request) => authenticateRequest(request);
analyticsIntelligenceRouter.get('/', async (req, res) => res.json({ insights: await listInsights(identity(req).userId) }));
analyticsIntelligenceRouter.post('/generate', async (req, res) => res.status(201).json({ insights: await generateAnalyticsInsights(identity(req).userId) }));
analyticsIntelligenceRouter.post('/:id/decision', async (req, res) => res.json(await decideInsight(identity(req).userId, req.params.id, req.body)));
export { intelligenceErrorStatus };
