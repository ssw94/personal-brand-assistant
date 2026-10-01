import { healthResponseSchema, type HealthResponse } from '@pba/shared';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${apiUrl}/health`);
  if (!response.ok) throw new Error('The API is unavailable right now.');
  return healthResponseSchema.parse(await response.json());
}
