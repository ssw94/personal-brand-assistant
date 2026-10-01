import { describe, expect, it } from 'vitest';
import { getHealthResponse } from './app.js';

describe('health endpoint', () => {
  it('returns a validated service health response', async () => {
    const response = getHealthResponse();
    expect(response.status).toBe('ok');
    expect(response.service).toBe('personal-brand-assistant-api');
    expect(new Date(response.timestamp).toString()).not.toBe('Invalid Date');
  });
});
