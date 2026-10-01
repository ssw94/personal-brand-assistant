import { Router, type Request } from 'express';
import { z } from 'zod';
import { createJob, deleteJob, getJob, JobNotFoundError, listJobs, saveJob, unsaveJob, updateJob } from './jobService.js';
import { createJobSourceProvider } from './jobSourceProvider.js';

export const jobRouter = Router();
function user(request: Request) { const value = request.header('x-user-id')?.trim(); if (!value) { const error = new Error('x-user-id header is required'); error.name = 'MissingUserError'; throw error; } return value; }
const id = (request: Request) => z.string().trim().min(1).parse(request.params.id);
jobRouter.get('/', async (req, res) => res.json({ jobs: await listJobs(user(req), { search: typeof req.query.search === 'string' ? req.query.search : undefined, saved: req.query.saved === 'true', remoteStatus: typeof req.query.remoteStatus === 'string' ? req.query.remoteStatus : undefined }) }));
jobRouter.post('/', async (req, res) => res.status(201).json({ job: await createJob(user(req), req.body) }));
jobRouter.get('/sources/status', async (_req, res) => res.json({ provider: createJobSourceProvider().name, externalFetchingEnabled: false }));
jobRouter.get('/:id', async (req, res) => res.json({ job: await getJob(user(req), id(req)) }));
jobRouter.put('/:id', async (req, res) => res.json({ job: await updateJob(user(req), id(req), req.body) }));
jobRouter.post('/:id/save', async (req, res) => res.json({ savedJob: await saveJob(user(req), id(req), req.body) }));
jobRouter.delete('/:id/save', async (req, res) => { await unsaveJob(user(req), id(req)); res.status(204).send(); });
jobRouter.delete('/:id', async (req, res) => { await deleteJob(user(req), id(req)); res.status(204).send(); });
export function jobErrorStatus(error: unknown) { if (error instanceof z.ZodError) return 400; if (error instanceof JobNotFoundError) return 404; if (error instanceof Error && error.name === 'MissingUserError') return 401; return 500; }
