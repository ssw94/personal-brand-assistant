import { Router, type Request } from 'express';
import { authenticateRequest } from './auth.js';
import { completeLinkedInOAuth, linkedinErrorStatus, publishApprovedDraft, startLinkedInOAuth } from './linkedinService.js';
import { prisma } from './prisma.js';

export const linkedinRouter = Router();
const identity = (request: Request) => authenticateRequest(request);
linkedinRouter.get('/oauth/start', async (req, res) => res.json(await startLinkedInOAuth(identity(req).userId)));
linkedinRouter.get('/accounts', async (req, res) => res.json({ accounts: await prisma.linkedInAccount.findMany({ where: { userId: identity(req).userId, disconnectedAt: null }, select: { id: true, providerMemberId: true, displayName: true, scopes: true, connectedAt: true } }) }));
linkedinRouter.post('/oauth/callback', async (req, res) => res.json(await completeLinkedInOAuth(identity(req).userId, { state: String(req.body.state ?? ''), code: String(req.body.code ?? ''), codeVerifier: String(req.body.codeVerifier ?? '') })));
linkedinRouter.post('/publish', async (req, res) => res.status(201).json(await publishApprovedDraft(identity(req).userId, String(req.body.draftId), String(req.body.accountId))));
export { linkedinErrorStatus };
