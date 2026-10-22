import { Router, type Request } from 'express';
import { authenticateRequest } from './auth.js';
import { createResearchRun, getResearchRun, listResearchRuns, researchErrorStatus } from './researchService.js';
import { z } from 'zod';

export const researchRouter = Router();
const identity = (request: Request) => authenticateRequest(request);
const runId = (request: Request) => z.string().trim().min(1).parse(request.params.id);

researchRouter.get('/runs', async (req, res) => res.json({ runs: await listResearchRuns(identity(req).userId) }));
researchRouter.get('/runs/:id', async (req, res) => res.json({ run: await getResearchRun(identity(req).userId, runId(req)) }));
researchRouter.post('/runs', async (req, res) => res.status(201).json({ run: await createResearchRun(identity(req).userId, req.body) }));

export { researchErrorStatus };
