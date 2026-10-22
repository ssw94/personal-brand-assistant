import { Router } from 'express';
import { processStripeWebhook, stripeErrorStatus } from './stripeService.js';
export const stripeRouter = Router();
stripeRouter.post('/webhook', async (req, res) => { const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody; if (!rawBody) return res.status(400).json({ error: 'Raw webhook body is required.' }); return res.json(await processStripeWebhook(rawBody, req.header('stripe-signature') ?? '')); });
export { stripeErrorStatus };
