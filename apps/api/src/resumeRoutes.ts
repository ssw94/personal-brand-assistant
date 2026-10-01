import { Router, type Request } from 'express';
import { z } from 'zod';
import { deleteResume, autosaveResume, createResume, duplicateResume, getResume, listResumes, ResumeNotFoundError, saveResumeVersion } from './resumeService.js';

export const resumeRouter = Router();
function user(request: Request) { const value = request.header('x-user-id')?.trim(); if (!value) { const error = new Error('x-user-id header is required'); error.name = 'MissingUserError'; throw error; } return value; }
const id = (request: Request) => z.string().trim().min(1).parse(request.params.id);

resumeRouter.get('/', async (req, res) => res.json({ resumes: await listResumes(user(req)) }));
resumeRouter.post('/', async (req, res) => res.status(201).json({ resume: await createResume(user(req), req.body) }));
resumeRouter.get('/:id', async (req, res) => res.json({ resume: await getResume(user(req), id(req)) }));
resumeRouter.patch('/:id/draft', async (req, res) => res.json({ resume: await autosaveResume(user(req), id(req), req.body) }));
resumeRouter.post('/:id/versions', async (req, res) => res.status(201).json({ resume: await saveResumeVersion(user(req), id(req), req.body) }));
resumeRouter.post('/:id/duplicate', async (req, res) => res.status(201).json({ resume: await duplicateResume(user(req), id(req)) }));
resumeRouter.delete('/:id', async (req, res) => { await deleteResume(user(req), id(req)); res.status(204).send(); });

export function resumeErrorStatus(error: unknown) { if (error instanceof z.ZodError) return 400; if (error instanceof ResumeNotFoundError) return 404; if (error instanceof Error && error.name === 'MissingUserError') return 401; return 500; }
