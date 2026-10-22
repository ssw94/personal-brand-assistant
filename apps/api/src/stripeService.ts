import crypto from 'node:crypto';
import { planCatalog } from '@pba/shared';
import { prisma } from './prisma.js';

export class StripeWebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StripeWebhookError';
  }
}
export class StripeCheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StripeCheckoutError';
  }
}
function secret() {
  const value = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!value) throw new StripeWebhookError('Stripe webhook is not configured.');
  return value;
}
function apiSecret() {
  const value = process.env.STRIPE_SECRET_KEY?.trim();
  if (!value) throw new StripeCheckoutError('Stripe checkout is not configured.');
  return value;
}
function priceId(planId: string) {
  const value = process.env[`STRIPE_PRICE_ID_${planId}`]?.trim();
  if (!value) throw new StripeCheckoutError(`Stripe price is not configured for ${planId}.`);
  return value;
}
function approvedReturnUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new StripeCheckoutError('Checkout return URL is invalid.');
  }
  if (url.protocol !== 'https:' && process.env.NODE_ENV === 'production')
    throw new StripeCheckoutError('Checkout return URL must use HTTPS.');
  const allowed = (process.env.WEB_ORIGINS ?? process.env.WEB_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (allowed.length && !allowed.includes(url.origin))
    throw new StripeCheckoutError('Checkout return URL origin is not approved.');
  return url.toString();
}
async function stripeRequest<T>(path: string, body: URLSearchParams) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${apiSecret()}:`).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!response.ok)
    throw new StripeCheckoutError(payload.error?.message ?? 'Stripe request failed.');
  return payload;
}
async function getOrCreateCustomer(userId: string) {
  const existing = await prisma.stripeCustomer.findUnique({ where: { userId } });
  if (existing) return existing;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) throw new StripeCheckoutError('User not found.');
  const customer = await stripeRequest<{ id?: string }>(
    'customers',
    new URLSearchParams({ email: user.email, 'metadata[userId]': userId }),
  );
  if (!customer.id) throw new StripeCheckoutError('Stripe did not return a customer id.');
  return prisma.stripeCustomer.create({ data: { userId, providerCustomerId: customer.id } });
}
export async function getBillingStatus(userId: string) {
  const [customer, subscription] = await Promise.all([
    prisma.stripeCustomer.findUnique({ where: { userId }, select: { providerCustomerId: true } }),
    prisma.stripeSubscription.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        status: true,
        planId: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        updatedAt: true,
      },
    }),
  ]);
  return {
    customerConfigured: Boolean(customer),
    subscription: subscription
      ? {
          status: subscription.status,
          planId: subscription.planId,
          currentPeriodStart: subscription.currentPeriodStart?.toISOString() ?? null,
          currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          updatedAt: subscription.updatedAt.toISOString(),
        }
      : null,
  };
}
export async function createCheckoutSession(userId: string, input: unknown) {
  const value = input as { planId?: string; successUrl?: string; cancelUrl?: string };
  const plan = planCatalog.find((item) => item.id === value.planId);
  if (!plan || plan.id === 'FREE' || plan.id === 'TEAM' || plan.price === null)
    throw new StripeCheckoutError('Only an approved paid self-serve plan can be checked out.');
  if (!value.successUrl || !value.cancelUrl)
    throw new StripeCheckoutError('Checkout return URLs are required.');
  const customer = await getOrCreateCustomer(userId);
  const session = await stripeRequest<{ id?: string; url?: string }>(
    'checkout/sessions',
    new URLSearchParams({
      mode: 'subscription',
      customer: customer.providerCustomerId,
      'line_items[0][price]': priceId(plan.id),
      'line_items[0][quantity]': '1',
      success_url: approvedReturnUrl(value.successUrl),
      cancel_url: approvedReturnUrl(value.cancelUrl),
      'metadata[userId]': userId,
      'metadata[planId]': plan.id,
      'subscription_data[metadata][userId]': userId,
      'subscription_data[metadata][planId]': plan.id,
    }),
  );
  if (!session.id || !session.url)
    throw new StripeCheckoutError('Stripe did not return a checkout session.');
  return { id: session.id, url: session.url, planId: plan.id };
}
export async function createPortalSession(userId: string, returnUrl: string) {
  if (!returnUrl) throw new StripeCheckoutError('Portal return URL is required.');
  const customer = await getOrCreateCustomer(userId);
  const session = await stripeRequest<{ id?: string; url?: string }>(
    'billing_portal/sessions',
    new URLSearchParams({
      customer: customer.providerCustomerId,
      return_url: approvedReturnUrl(returnUrl),
    }),
  );
  if (!session.id || !session.url)
    throw new StripeCheckoutError('Stripe did not return a portal session.');
  return { id: session.id, url: session.url };
}
export function verifyStripeSignature(rawBody: Buffer, signature: string, toleranceSeconds = 300) {
  const parts = Object.fromEntries(signature.split(',').map((part) => part.split('='))) as {
    t?: string;
    v1?: string;
  };
  if (!parts.t || !parts.v1) throw new StripeWebhookError('Invalid Stripe signature.');
  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds)
    throw new StripeWebhookError('Expired Stripe signature.');
  const expected = crypto
    .createHmac('sha256', secret())
    .update(`${parts.t}.${rawBody.toString('utf8')}`)
    .digest('hex');
  if (
    expected.length !== parts.v1.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1))
  )
    throw new StripeWebhookError('Invalid Stripe signature.');
}
function providerDate(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}

function providerBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : false;
}

export function readStripeSubscriptionState(object: Record<string, unknown>) {
  const providerSubscriptionId = typeof object.id === 'string' ? object.id : null;
  const status = typeof object.status === 'string' ? object.status : null;
  const metadata = object.metadata as Record<string, unknown> | undefined;
  const planId = typeof metadata?.planId === 'string' ? metadata.planId : null;
  if (
    !providerSubscriptionId ||
    !status ||
    !planId ||
    !planCatalog.some((plan) => plan.id === planId)
  )
    return null;
  return {
    providerSubscriptionId,
    status,
    planId,
    currentPeriodStart: providerDate(object.current_period_start),
    currentPeriodEnd: providerDate(object.current_period_end),
    cancelAtPeriodEnd: providerBoolean(object.cancel_at_period_end),
  };
}
export async function processStripeWebhook(rawBody: Buffer, signature: string) {
  verifyStripeSignature(rawBody, signature);
  let event: { id?: string; type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody.toString('utf8')) as typeof event;
  } catch {
    throw new StripeWebhookError('Invalid Stripe event body.');
  }
  if (!event.id || !event.type || !event.data?.object)
    throw new StripeWebhookError('Incomplete Stripe event.');
  const payloadHash = crypto.createHash('sha256').update(rawBody).digest('hex');
  const existing = await prisma.stripeEvent.findUnique({ where: { providerEventId: event.id } });
  if (existing) return { received: true, duplicate: true };
  const object = event.data.object;
  const customerId = typeof object.customer === 'string' ? object.customer : null;
  const customer = customerId
    ? await prisma.stripeCustomer.findUnique({ where: { providerCustomerId: customerId } })
    : null;
  await prisma.$transaction(async (tx) => {
    await tx.stripeEvent.create({
      data: {
        providerEventId: event.id!,
        eventType: event.type!,
        payloadHash,
        userId: customer?.userId ?? null,
        processedAt: new Date(),
      },
    });
    if (
      customer &&
      (event.type === 'customer.subscription.created' ||
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted')
    ) {
      const subscription = readStripeSubscriptionState(object);
      if (!subscription)
        throw new StripeWebhookError('Stripe subscription lacks an approved plan mapping.');
      await tx.stripeSubscription.upsert({
        where: { providerSubscriptionId: subscription.providerSubscriptionId },
        create: {
          userId: customer.userId,
          providerSubscriptionId: subscription.providerSubscriptionId,
          providerCustomerId: customerId!,
          status: subscription.status,
          planId: subscription.planId,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        },
        update: {
          status: subscription.status,
          planId: subscription.planId,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        },
      });
      await tx.user.update({
        where: { id: customer.userId },
        data: {
          plan:
            subscription.status === 'active' || subscription.status === 'trialing'
              ? subscription.planId
              : 'FREE',
        },
      });
    }
  });
  return { received: true, duplicate: false };
}
export function stripeErrorStatus(error: unknown) {
  return error instanceof StripeWebhookError || error instanceof StripeCheckoutError ? 400 : 500;
}
