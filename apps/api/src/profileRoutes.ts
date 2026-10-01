import { Router, type Request } from 'express';
import { z } from 'zod';
import { createAchievement, createCertification, createEducation, createExperience, createProject, createSkill, deleteEducation, deleteExperience, deleteProject, deleteSkill, getProfile, ProfileNotFoundError, updateEducation, updateExperience, updateProject, updateSkill, upsertProfile } from './profileService.js';
export const profileRouter = Router();
function user(request: Request) { const value = request.header('x-user-id')?.trim(); if (!value) { const error = new Error('x-user-id header is required'); error.name = 'MissingUserError'; throw error; } return value; }
const itemId = (request: Request) => z.string().trim().min(1).parse(request.params.id);
profileRouter.get('/', async (req, res) => res.json({ profile: await getProfile(user(req)) }));
profileRouter.put('/', async (req, res) => res.json({ profile: await upsertProfile(user(req), req.body, req.header('x-user-email')?.trim()) }));
type Operation = (userId: string, body: unknown) => Promise<unknown>;
type DeleteOperation = (userId: string, id: string) => Promise<void>;
const crud = (path: string, create: Operation, update: (userId: string, id: string, body: unknown) => Promise<unknown>, remove: DeleteOperation) => { profileRouter.post(path, async (req, res) => res.status(201).json(await create(user(req), req.body))); profileRouter.put(`${path}/:id`, async (req, res) => res.json(await update(user(req), itemId(req), req.body))); profileRouter.delete(`${path}/:id`, async (req, res) => { await remove(user(req), itemId(req)); res.status(204).send(); }); };
crud('/experiences', createExperience, updateExperience, deleteExperience); crud('/education', createEducation, updateEducation, deleteEducation); crud('/projects', createProject, updateProject, deleteProject); crud('/skills', createSkill, updateSkill, deleteSkill);
profileRouter.post('/certifications', async (req, res) => res.status(201).json(await createCertification(user(req), req.body)));
profileRouter.post('/achievements', async (req, res) => res.status(201).json(await createAchievement(user(req), req.body)));
export function profileErrorStatus(error: unknown) { if (error instanceof z.ZodError) return 400; if (error instanceof ProfileNotFoundError) return 404; if (error instanceof Error && (error.name === 'MissingUserError' || error.name === 'MissingUserEmailError')) return 401; return 500; }
