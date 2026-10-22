import { Router, type Request } from 'express';
import { authenticateRequest } from './auth.js';
import {
  createCheckoutSession,
  createPortalSession,
  getBillingStatus,
  processStripeWebhook,
  stripeErrorStatus,
} from './stripeService.js';
export const stripeRouter = Router();
stripeRouter.post('/webhook', async (req, res) => {
  const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;
  if (!rawBody) return res.status(400).json({ error: 'Raw webhook body is required.' });
  return res.json(await processStripeWebhook(rawBody, req.header('stripe-signature') ?? ''));
});
stripeRouter.post('/checkout', async (req: Request, res) =>
  res.status(201).json(await createCheckoutSession(authenticateRequest(req).userId, req.body)),
);
stripeRouter.post('/portal', async (req: Request, res) =>
  res.json(
    await createPortalSession(authenticateRequest(req).userId, String(req.body.returnUrl ?? '')),
  ),
);
stripeRouter.get('/status', async (req: Request, res) =>
  res.json(await getBillingStatus(authenticateRequest(req).userId)),
);
export { stripeErrorStatus };
