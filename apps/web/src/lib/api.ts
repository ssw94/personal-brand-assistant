import { healthResponseSchema, type HealthResponse } from '@pba/shared';
import { getApiBaseUrl } from './config';

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${getApiBaseUrl()}/health`);
  if (!response.ok) throw new Error('The API is unavailable right now.');
  return healthResponseSchema.parse(await response.json());
}
