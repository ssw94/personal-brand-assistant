import { Router, type Request } from 'express';
import { authenticateRequest, clearSessionCookie, sessionCookie } from './auth.js';
import {
  authServiceErrorStatus,
  completeOnboarding,
  getAccount,
  signin,
  signup,
} from './authService.js';
export const authRouter = Router();
function responseForEnvironment(result: { token: string; user: unknown }) {
  return process.env.NODE_ENV === 'production' ? { user: result.user } : result;
}
authRouter.post('/signup', async (req, res) => {
  const result = await signup(req.body);
  res.setHeader('Set-Cookie', sessionCookie(result.token));
  return res.status(201).json(responseForEnvironment(result));
});
authRouter.post('/signin', async (req, res) => {
  const result = await signin(req.body);
  res.setHeader('Set-Cookie', sessionCookie(result.token));
  return res.json(responseForEnvironment(result));
});
authRouter.post('/signout', (_req, res) => {
  res.setHeader('Set-Cookie', clearSessionCookie());
  return res.status(204).send();
});
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
