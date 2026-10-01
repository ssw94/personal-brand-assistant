import { Router, type Request } from 'express';
import { z } from 'zod';
import { deleteResume, autosaveResume, createResume, duplicateResume, getResume, listResumes, ResumeNotFoundError, saveResumeVersion } from './resumeService.js';
import { applyOptimization, createOptimization, getOptimization, OptimizationNotFoundError, regenerateOptimization, SuggestionNotFoundError, updateSuggestion } from './resumeOptimizationService.js';
import { authenticateRequest } from './auth.js';

export const resumeRouter = Router();
function user(request: Request) { return authenticateRequest(request).userId; }
const id = (request: Request) => z.string().trim().min(1).parse(request.params.id);

resumeRouter.get('/', async (req, res) => res.json({ resumes: await listResumes(user(req)) }));
resumeRouter.post('/', async (req, res) => res.status(201).json({ resume: await createResume(user(req), req.body) }));
resumeRouter.get('/:id', async (req, res) => res.json({ resume: await getResume(user(req), id(req)) }));
resumeRouter.patch('/:id/draft', async (req, res) => res.json({ resume: await autosaveResume(user(req), id(req), req.body) }));
resumeRouter.post('/:id/versions', async (req, res) => res.status(201).json({ resume: await saveResumeVersion(user(req), id(req), req.body) }));
resumeRouter.post('/:id/duplicate', async (req, res) => res.status(201).json({ resume: await duplicateResume(user(req), id(req)) }));
resumeRouter.post('/:id/optimizations', async (req, res) => res.status(201).json({ optimization: await createOptimization(user(req), id(req), req.body) }));
resumeRouter.get('/:id/optimizations/:optimizationId', async (req, res) => res.json({ optimization: await getOptimization(user(req), id(req), z.string().trim().min(1).parse(req.params.optimizationId)) }));
resumeRouter.post('/:id/optimizations/:optimizationId/regenerate', async (req, res) => res.json({ optimization: await regenerateOptimization(user(req), id(req), z.string().trim().min(1).parse(req.params.optimizationId)) }));
resumeRouter.patch('/:id/optimizations/:optimizationId/suggestions/:suggestionId', async (req, res) => res.json({ optimization: await updateSuggestion(user(req), id(req), z.string().trim().min(1).parse(req.params.optimizationId), z.string().trim().min(1).parse(req.params.suggestionId), req.body) }));
resumeRouter.post('/:id/optimizations/:optimizationId/apply', async (req, res) => res.status(201).json({ resume: await applyOptimization(user(req), id(req), z.string().trim().min(1).parse(req.params.optimizationId)) }));
resumeRouter.delete('/:id', async (req, res) => { await deleteResume(user(req), id(req)); res.status(204).send(); });

export function resumeErrorStatus(error: unknown) { if (error instanceof z.ZodError) return 400; if (error instanceof ResumeNotFoundError || error instanceof OptimizationNotFoundError || error instanceof SuggestionNotFoundError) return 404; if (error instanceof Error && error.name === 'MissingUserError') return 401; return 500; }
