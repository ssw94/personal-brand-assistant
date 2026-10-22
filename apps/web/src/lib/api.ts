import {
  healthResponseSchema,
  usageSummarySchema,
  type HealthResponse,
  type UsageSummary,
} from '@pba/shared';
import { getApiBaseUrl } from './config';
import { authHeaders } from './session';

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${getApiBaseUrl()}/health`);
  if (!response.ok) throw new Error('The API is unavailable right now.');
  return healthResponseSchema.parse(await response.json());
}

export async function getUsageSummary(): Promise<UsageSummary> {
  const response = await fetch(`${getApiBaseUrl()}/usage`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Usage information is unavailable.');
  return usageSummarySchema.parse(await response.json());
}
export async function createCheckoutSession(planId: string): Promise<{ url: string }> {
  const response = await fetch(`${getApiBaseUrl()}/billing/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      planId,
      successUrl: `${window.location.origin}/billing?checkout=success`,
      cancelUrl: `${window.location.origin}/billing?checkout=cancelled`,
    }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? 'Checkout could not be started.');
  }
  return response.json();
}
export async function createBillingPortal(): Promise<{ url: string }> {
  const response = await fetch(`${getApiBaseUrl()}/billing/portal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ returnUrl: `${window.location.origin}/billing` }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? 'Billing portal could not be opened.');
  }
  return response.json();
}
