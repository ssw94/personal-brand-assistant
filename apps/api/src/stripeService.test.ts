import crypto from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import {
  readStripeSubscriptionState,
  StripeWebhookError,
  verifyStripeSignature,
} from './stripeService.js';

describe('Stripe webhook verification', () => {
  const previous = process.env.STRIPE_WEBHOOK_SECRET;
  afterEach(() => { if (previous === undefined) delete process.env.STRIPE_WEBHOOK_SECRET; else process.env.STRIPE_WEBHOOK_SECRET = previous; });
  it('accepts a valid signed raw body', () => { process.env.STRIPE_WEBHOOK_SECRET = 'test-secret'; const body = Buffer.from('{"id":"evt_1"}'); const timestamp = Math.floor(Date.now() / 1000).toString(); const signature = crypto.createHmac('sha256', 'test-secret').update(`${timestamp}.${body.toString()}`).digest('hex'); expect(() => verifyStripeSignature(body, `t=${timestamp},v1=${signature}`)).not.toThrow(); });
  it('rejects a forged signature', () => { process.env.STRIPE_WEBHOOK_SECRET = 'test-secret'; const body = Buffer.from('{}'); const timestamp = Math.floor(Date.now() / 1000).toString(); expect(() => verifyStripeSignature(body, `t=${timestamp},v1=${'0'.repeat(64)}`)).toThrow(StripeWebhookError); });
  it('projects approved subscription state including provider period fields', () => {
    const state = readStripeSubscriptionState({
      id: 'sub_1',
      status: 'active',
      metadata: { planId: 'PRO' },
      current_period_start: 1_700_000_000,
      current_period_end: 1_700_259_200,
      cancel_at_period_end: true,
    });
    expect(state).toMatchObject({
      providerSubscriptionId: 'sub_1',
      status: 'active',
      planId: 'PRO',
      cancelAtPeriodEnd: true,
    });
    expect(state?.currentPeriodStart).toEqual(new Date(1_700_000_000 * 1000));
    expect(state?.currentPeriodEnd).toEqual(new Date(1_700_259_200 * 1000));
  });
  it('rejects subscriptions without an approved plan mapping', () => {
    expect(readStripeSubscriptionState({ id: 'sub_1', status: 'active', metadata: { planId: 'UNAPPROVED' } })).toBeNull();
  });
});
