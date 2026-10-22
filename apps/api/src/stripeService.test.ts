import crypto from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { StripeWebhookError, verifyStripeSignature } from './stripeService.js';

describe('Stripe webhook verification', () => {
  const previous = process.env.STRIPE_WEBHOOK_SECRET;
  afterEach(() => { if (previous === undefined) delete process.env.STRIPE_WEBHOOK_SECRET; else process.env.STRIPE_WEBHOOK_SECRET = previous; });
  it('accepts a valid signed raw body', () => { process.env.STRIPE_WEBHOOK_SECRET = 'test-secret'; const body = Buffer.from('{"id":"evt_1"}'); const timestamp = Math.floor(Date.now() / 1000).toString(); const signature = crypto.createHmac('sha256', 'test-secret').update(`${timestamp}.${body.toString()}`).digest('hex'); expect(() => verifyStripeSignature(body, `t=${timestamp},v1=${signature}`)).not.toThrow(); });
  it('rejects a forged signature', () => { process.env.STRIPE_WEBHOOK_SECRET = 'test-secret'; const body = Buffer.from('{}'); const timestamp = Math.floor(Date.now() / 1000).toString(); expect(() => verifyStripeSignature(body, `t=${timestamp},v1=${'0'.repeat(64)}`)).toThrow(StripeWebhookError); });
});
