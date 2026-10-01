import { Router, type Request } from 'express';
import { z } from 'zod';
import { ApplicationNotFoundError, createApplication, deleteApplication, getApplication, listApplications, updateApplication } from './applicationService.js';
import { JobNotFoundError } from './jobService.js';
import { generateInterviewPreparation, getInterviewPreparation, updateInterviewPreparation } from './interviewPreparationService.js';

export const applicationRouter = Router();
function user(request: Request) { const value = request.header('x-user-id')?.trim(); if (!value) { const error = new Error('x-user-id header is required'); error.name = 'MissingUserError'; throw error; } return value; }
const id = (request: Request) => z.string().trim().min(1).parse(request.params.id);
applicationRouter.get('/', async (req, res) => res.json({ applications: await listApplications(user(req), { search: typeof req.query.search === 'string' ? req.query.search : undefined, status: typeof req.query.status === 'string' ? req.query.status : undefined }) }));
applicationRouter.post('/', async (req, res) => res.status(201).json({ application: await createApplication(user(req), req.body) }));
applicationRouter.get('/:id/interview-preparation', async (req, res) => res.json({ interview: await getInterviewPreparation(user(req), id(req)) }));
applicationRouter.post('/:id/interview-preparation', async (req, res) => res.status(201).json({ interview: await generateInterviewPreparation(user(req), id(req), req.body) }));
applicationRouter.patch('/:id/interview-preparation', async (req, res) => res.json({ interview: await updateInterviewPreparation(user(req), id(req), req.body) }));
applicationRouter.get('/:id', async (req, res) => res.json({ application: await getApplication(user(req), id(req)) }));
applicationRouter.patch('/:id', async (req, res) => res.json({ application: await updateApplication(user(req), id(req), req.body) }));
applicationRouter.delete('/:id', async (req, res) => { await deleteApplication(user(req), id(req)); res.status(204).send(); });
export function applicationErrorStatus(error: unknown) { if (error instanceof z.ZodError) return 400; if (error instanceof ApplicationNotFoundError || error instanceof JobNotFoundError) return 404; if (error instanceof Error && error.name === 'MissingUserError') return 401; return 500; }
export { interviewPreparationErrorStatus } from './interviewPreparationService.js';
