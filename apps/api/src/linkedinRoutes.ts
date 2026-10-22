import { Router, type Request } from 'express';
import { authenticateRequest } from './auth.js';
import { completeLinkedInOAuth, linkedinErrorStatus, publishApprovedDraft, startLinkedInOAuth } from './linkedinService.js';

export const linkedinRouter = Router();
const identity = (request: Request) => authenticateRequest(request);
linkedinRouter.get('/oauth/start', async (req, res) => res.json(await startLinkedInOAuth(identity(req).userId)));
linkedinRouter.get('/oauth/callback', async (req, res) => res.json(await completeLinkedInOAuth({ state: String(req.query.state ?? ''), code: String(req.query.code ?? ''), codeVerifier: String(req.query.codeVerifier ?? '') })));
linkedinRouter.post('/publish', async (req, res) => res.status(201).json(await publishApprovedDraft(identity(req).userId, String(req.body.draftId), String(req.body.accountId))));
export { linkedinErrorStatus };
