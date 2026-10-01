import { Router, type Request } from 'express';
import { z } from 'zod';
import { generateApplicationPackage, generateCoverLetter, getCoverLetter, updateCoverLetter } from './applicationPackageService.js';

export const applicationPackageRouter = Router();
function user(request: Request) { const value = request.header('x-user-id')?.trim(); if (!value) { const error = new Error('x-user-id header is required'); error.name = 'MissingUserError'; throw error; } return value; }
const id = (request: Request) => z.string().trim().min(1).parse(request.params.id);

applicationPackageRouter.post('/cover-letters', async (req, res) => res.status(201).json({ coverLetter: await generateCoverLetter(user(req), req.body) }));
applicationPackageRouter.get('/cover-letters/:id', async (req, res) => res.json({ coverLetter: await getCoverLetter(user(req), id(req)) }));
applicationPackageRouter.patch('/cover-letters/:id', async (req, res) => res.json({ coverLetter: await updateCoverLetter(user(req), id(req), req.body) }));
applicationPackageRouter.post('/', async (req, res) => res.status(201).json({ package: await generateApplicationPackage(user(req), req.body) }));

export { applicationPackageErrorStatus } from './applicationPackageService.js';
