import { afterEach, describe, expect, it } from 'vitest';
import { getRuntimeConfigStatus, isRuntimeReady } from './runtimeConfig.js';

const original = {
  nodeEnv: process.env.NODE_ENV,
  auth: process.env.AUTH_JWT_SECRET,
  headers: process.env.AUTH_ALLOW_IDENTITY_HEADERS,
  ai: process.env.OPENAI_API_KEY,
};
afterEach(() => {
  if (original.nodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = original.nodeEnv;
  if (original.auth === undefined) delete process.env.AUTH_JWT_SECRET;
  else process.env.AUTH_JWT_SECRET = original.auth;
  if (original.headers === undefined) delete process.env.AUTH_ALLOW_IDENTITY_HEADERS;
  else process.env.AUTH_ALLOW_IDENTITY_HEADERS = original.headers;
  if (original.ai === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = original.ai;
});

describe('runtime configuration status', () => {
  it('does not expose secret values and blocks production readiness without required providers', () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_JWT_SECRET = 'secret-value';
    process.env.AUTH_ALLOW_IDENTITY_HEADERS = 'false';
    delete process.env.OPENAI_API_KEY;
    const statuses = getRuntimeConfigStatus();
    expect(statuses.find((status) => status.name === 'ai')).toMatchObject({
      configured: false,
      required: true,
    });
    expect(JSON.stringify(statuses)).not.toContain('secret-value');
    expect(isRuntimeReady(true)).toBe(false);
  });
});
