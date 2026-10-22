import { Router, type Request } from 'express';
import { authenticateRequest } from './auth.js';
import { approvalErrorStatus, decideDraftApproval, submitDraftForReview } from './approvalService.js';

export const approvalRouter = Router();
const identity = (request: Request) => authenticateRequest(request);
approvalRouter.post('/:id/submit', async (req, res) => res.json(await submitDraftForReview(identity(req).userId, req.params.id)));
approvalRouter.post('/:id/decision', async (req, res) => res.json(await decideDraftApproval(identity(req).userId, req.params.id, req.body)));
export { approvalErrorStatus };
