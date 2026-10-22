import { Router, type Request } from 'express';
import { authenticateRequest } from './auth.js';
import { getUsageSummary, usageErrorStatus } from './usageService.js';

export const usageRouter = Router();
const identity = (request: Request) => authenticateRequest(request);
usageRouter.get('/', async (req, res) => res.json(await getUsageSummary(identity(req).userId)));
export { usageErrorStatus };
