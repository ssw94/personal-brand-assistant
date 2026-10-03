import { Router, type Request } from 'express';
import { authenticateRequest } from './auth.js';
import {
  authServiceErrorStatus,
  completeOnboarding,
  getAccount,
  signin,
  signup,
} from './authService.js';
export const authRouter = Router();
authRouter.post('/signup', async (req, res) => res.status(201).json(await signup(req.body)));
authRouter.post('/signin', async (req, res) => res.json(await signin(req.body)));
authRouter.get('/me', async (req: Request, res) =>
  res.json({ user: await getAccount(authenticateRequest(req).userId) }),
);
authRouter.post('/onboarding-complete', async (req: Request, res) =>
  res.json({ user: await completeOnboarding(authenticateRequest(req).userId) }),
);
authRouter.post('/forgot-password', async (_req, res) =>
  res.json({ message: 'If an account matches, password reset instructions will be sent.' }),
);
export { authServiceErrorStatus };
