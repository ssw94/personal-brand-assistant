import { healthResponseSchema, usageSummarySchema, type HealthResponse, type UsageSummary } from '@pba/shared';
import { getApiBaseUrl } from './config';
import { authHeaders } from './session';

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${getApiBaseUrl()}/health`);
  if (!response.ok) throw new Error('The API is unavailable right now.');
  return healthResponseSchema.parse(await response.json());
}

export async function getUsageSummary(): Promise<UsageSummary> { const response = await fetch(`${getApiBaseUrl()}/usage`, { headers: authHeaders() }); if (!response.ok) throw new Error('Usage information is unavailable.'); return usageSummarySchema.parse(await response.json()); }
