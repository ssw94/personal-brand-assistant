import { Router, type Request } from 'express';
import { authenticateRequest } from './auth.js';
import { generateWriterDraft, writerErrorStatus } from './writerService.js';
import { critiqueDraftWithAgent, criticErrorStatus } from './criticService.js';
import { reviseDraft, revisionErrorStatus } from './revisionService.js';

export const agentWorkflowRouter = Router();
const identity = (request: Request) => authenticateRequest(request);
agentWorkflowRouter.post('/writer/runs', async (req, res) => res.status(201).json(await generateWriterDraft(identity(req).userId, req.body)));
agentWorkflowRouter.post('/critic/runs', async (req, res) => res.status(201).json(await critiqueDraftWithAgent(identity(req).userId, req.body)));
agentWorkflowRouter.post('/revision/runs', async (req, res) => res.status(201).json(await reviseDraft(identity(req).userId, req.body)));
export function agentWorkflowErrorStatus(error: unknown) { return [writerErrorStatus, criticErrorStatus, revisionErrorStatus].map(map => map(error)).find(status => status !== 500) ?? 500; }
