import { Router, type Request } from 'express';
import { authenticateRequest } from './auth.js';
import { generateTopicCandidates, listTopicCandidates, reviewTopicCandidate, topicErrorStatus } from './topicService.js';
import { z } from 'zod';

export const topicRouter = Router();
const identity = (request: Request) => authenticateRequest(request);
const id = (request: Request) => z.string().trim().min(1).parse(request.params.id);
topicRouter.get('/candidates', async (req, res) => res.json({ candidates: await listTopicCandidates(identity(req).userId) }));
topicRouter.post('/runs', async (req, res) => res.status(201).json(await generateTopicCandidates(identity(req).userId, req.body)));
topicRouter.post('/candidates/:id/review', async (req, res) => res.json({ candidate: await reviewTopicCandidate(identity(req).userId, id(req), req.body) }));
export { topicErrorStatus };
