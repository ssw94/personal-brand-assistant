import { Router, type Request } from 'express';
import { authenticateRequest } from './auth.js';
import { getWorkflow, startContentWorkflow, workflowErrorStatus } from './workflowService.js';

export const workflowRouter = Router();
const identity = (request: Request) => authenticateRequest(request);
workflowRouter.get('/:id', async (req, res) => res.json({ workflow: await getWorkflow(identity(req).userId, req.params.id) }));
workflowRouter.post('/', async (req, res) => res.status(201).json({ workflow: await startContentWorkflow(identity(req).userId, req.body.topicId) }));
export { workflowErrorStatus };
