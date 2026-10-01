import { Router, type Request } from 'express';
import { z } from 'zod';
import { askCareerAssistant, getAssistantConversation, listAssistantConversations } from './careerAssistantService.js';
import { authenticateRequest } from './auth.js';

export const careerAssistantRouter = Router();
function user(request: Request) { return authenticateRequest(request).userId; }
const id = (request: Request) => z.string().trim().min(1).parse(request.params.id);
careerAssistantRouter.post('/ask', async (req, res) => res.status(201).json(await askCareerAssistant(user(req), req.body)));
careerAssistantRouter.get('/conversations', async (req, res) => res.json({ conversations: await listAssistantConversations(user(req)) }));
careerAssistantRouter.get('/conversations/:id', async (req, res) => res.json({ conversation: await getAssistantConversation(user(req), id(req)) }));
export { careerAssistantErrorStatus } from './careerAssistantService.js';
