import { Router, type Request } from 'express';
import { memoryReviewStateSchema, styleAnalysisRequestSchema } from '@pba/shared';
import { authenticateRequest } from './auth.js';
import { extractMemoryCandidates, createUserMemoryFact, getMemoryContext, getMemoryFact, getMemoryFactHistory, listMemoryFacts, MemoryNotFoundError, MemoryReviewError, reviewMemoryFact, updateMemoryFact } from './memoryService.js';
import { analyzeWritingStyle, createWritingStyleExample, deleteWritingStyleExample, getWritingStyleProfile, listWritingStyleExamples, updateWritingStyleExample, updateWritingStyleProfile, WritingStyleAnalysisError, WritingStyleNotFoundError } from './writingStyleService.js';
import { z } from 'zod';

export const professionalIntelligenceRouter = Router();
const identity = (request: Request) => authenticateRequest(request);
const itemId = (request: Request) => z.string().trim().min(1).parse(request.params.id);

professionalIntelligenceRouter.get('/memory', async (req, res) => { const state = req.query.state ? memoryReviewStateSchema.parse(req.query.state) : undefined; res.json({ facts: await listMemoryFacts(identity(req).userId, state) }); });
professionalIntelligenceRouter.get('/memory/context', async (req, res) => { const query = typeof req.query.query === 'string' ? req.query.query : undefined; const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 30; res.json(await getMemoryContext(identity(req).userId, query, limit)); });
professionalIntelligenceRouter.post('/memory/extract', async (req, res) => res.status(201).json(await extractMemoryCandidates(identity(req).userId)));
professionalIntelligenceRouter.get('/memory/:id', async (req, res) => res.json({ fact: await getMemoryFact(identity(req).userId, itemId(req)) }));
professionalIntelligenceRouter.get('/memory/:id/history', async (req, res) => res.json({ versions: await getMemoryFactHistory(identity(req).userId, itemId(req)) }));
professionalIntelligenceRouter.post('/memory', async (req, res) => res.status(201).json({ fact: await createUserMemoryFact(identity(req).userId, req.body) }));
professionalIntelligenceRouter.patch('/memory/:id', async (req, res) => res.json({ fact: await updateMemoryFact(identity(req).userId, itemId(req), req.body) }));
professionalIntelligenceRouter.post('/memory/:id/review', async (req, res) => res.json({ fact: await reviewMemoryFact(identity(req).userId, itemId(req), req.body) }));

professionalIntelligenceRouter.get('/style', async (req, res) => res.json({ profile: await getWritingStyleProfile(identity(req).userId) }));
professionalIntelligenceRouter.put('/style', async (req, res) => res.json({ profile: await updateWritingStyleProfile(identity(req).userId, req.body) }));
professionalIntelligenceRouter.get('/style/examples', async (req, res) => res.json({ examples: await listWritingStyleExamples(identity(req).userId) }));
professionalIntelligenceRouter.post('/style/examples', async (req, res) => res.status(201).json({ example: await createWritingStyleExample(identity(req).userId, req.body) }));
professionalIntelligenceRouter.patch('/style/examples/:id', async (req, res) => res.json({ example: await updateWritingStyleExample(identity(req).userId, itemId(req), req.body) }));
professionalIntelligenceRouter.delete('/style/examples/:id', async (req, res) => { await deleteWritingStyleExample(identity(req).userId, itemId(req)); res.status(204).send(); });
professionalIntelligenceRouter.post('/style/analyze', async (req, res) => { styleAnalysisRequestSchema.parse(req.body); res.json(await analyzeWritingStyle(identity(req).userId, req.body)); });

export function professionalIntelligenceErrorStatus(error: unknown) { if (error instanceof z.ZodError) return 400; if (error instanceof MemoryNotFoundError || error instanceof WritingStyleNotFoundError) return 404; if (error instanceof MemoryReviewError || error instanceof WritingStyleAnalysisError) return 409; return 500; }
