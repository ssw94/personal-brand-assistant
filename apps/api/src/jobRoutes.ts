import { Router, type Request } from 'express';
import { z } from 'zod';
import { createJob, deleteJob, getJob, JobNotFoundError, listJobs, saveJob, unsaveJob, updateJob } from './jobService.js';
import { remoteStatusSchema } from '@pba/shared';
import { createJobSourceProvider } from './jobSourceProvider.js';
import { authenticateRequest } from './auth.js';

export const jobRouter = Router();
function user(request: Request) { return authenticateRequest(request).userId; }
const id = (request: Request) => z.string().trim().min(1).parse(request.params.id);
jobRouter.get('/', async (req, res) => { const query = z.object({ search: z.string().trim().max(200).optional(), saved: z.enum(['true', 'false']).optional(), remoteStatus: remoteStatusSchema.optional() }).parse(req.query); return res.json({ jobs: await listJobs(user(req), { search: query.search, saved: query.saved === 'true', remoteStatus: query.remoteStatus }) }); });
jobRouter.post('/', async (req, res) => res.status(201).json({ job: await createJob(user(req), req.body) }));
jobRouter.get('/sources/status', async (_req, res) => res.json({ provider: createJobSourceProvider().name, externalFetchingEnabled: false }));
jobRouter.get('/:id', async (req, res) => res.json({ job: await getJob(user(req), id(req)) }));
jobRouter.put('/:id', async (req, res) => res.json({ job: await updateJob(user(req), id(req), req.body) }));
jobRouter.post('/:id/save', async (req, res) => res.json({ savedJob: await saveJob(user(req), id(req), req.body) }));
jobRouter.delete('/:id/save', async (req, res) => { await unsaveJob(user(req), id(req)); res.status(204).send(); });
jobRouter.delete('/:id', async (req, res) => { await deleteJob(user(req), id(req)); res.status(204).send(); });
export function jobErrorStatus(error: unknown) { if (error instanceof z.ZodError) return 400; if (error instanceof JobNotFoundError) return 404; if (error instanceof Error && error.name === 'MissingUserError') return 401; return 500; }
