import { Router, type Request } from 'express';
import { authenticateRequest } from './auth.js';
import { cancelScheduledJob, listScheduledJobs, scheduleApprovedDraft, schedulingErrorStatus } from './schedulingService.js';
export const schedulingRouter = Router(); const identity = (request: Request) => authenticateRequest(request);
schedulingRouter.get('/', async (req, res) => res.json({ jobs: await listScheduledJobs(identity(req).userId) }));
schedulingRouter.post('/', async (req, res) => res.status(201).json({ job: await scheduleApprovedDraft(identity(req).userId, req.body) }));
schedulingRouter.post('/:id/cancel', async (req, res) => res.json(await cancelScheduledJob(identity(req).userId, req.params.id)));
export { schedulingErrorStatus };
