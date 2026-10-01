import { createHmac } from 'node:crypto';
import { describe, expect, it, afterEach } from 'vitest';
import type { Request } from 'express';
import { authenticateRequest } from './auth.js';

function request(headers: Record<string, string>): Request { return { header: (name: string) => headers[name.toLowerCase()] } as unknown as Request; }
function token(payload: Record<string, unknown>, secret: string) { const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url'); const header = encode({ alg: 'HS256', typ: 'JWT' }); const body = encode(payload); const signature = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url'); return `${header}.${body}.${signature}`; }
const originalNodeEnv = process.env.NODE_ENV; const originalSecret = process.env.AUTH_JWT_SECRET;
afterEach(() => { if (originalNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalNodeEnv; if (originalSecret === undefined) delete process.env.AUTH_JWT_SECRET; else process.env.AUTH_JWT_SECRET = originalSecret; });

describe('request authentication', () => {
  it('allows local identity headers only outside production', () => {
    delete process.env.NODE_ENV;
    expect(authenticateRequest(request({ 'x-user-id': 'user-1', 'x-user-email': 'person@example.com' }))).toEqual({ userId: 'user-1', email: 'person@example.com' });
  });
  it('requires and verifies a bearer token in production', () => {
    process.env.NODE_ENV = 'production'; process.env.AUTH_JWT_SECRET = 'test-secret';
    const identity = authenticateRequest(request({ authorization: `Bearer ${token({ sub: 'user-2', exp: Math.floor(Date.now() / 1000) + 60 }, 'test-secret')}` }));
    expect(identity.userId).toBe('user-2');
    expect(() => authenticateRequest(request({ 'x-user-id': 'spoofed' }))).toThrow('bearer token');
  });
  it('rejects a tampered bearer token', () => {
    process.env.NODE_ENV = 'production'; process.env.AUTH_JWT_SECRET = 'test-secret';
    const value = token({ sub: 'user-3' }, 'wrong-secret');
    expect(() => authenticateRequest(request({ authorization: `Bearer ${value}` }))).toThrow('Invalid bearer token');
  });
});
