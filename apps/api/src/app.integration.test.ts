import { createServer, type Server } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';

let server: Server | undefined;
const originalNodeEnv = process.env.NODE_ENV; const originalSecret = process.env.AUTH_JWT_SECRET;
afterEach(async () => { if (server) await new Promise<void>(resolve => server!.close(() => resolve())); server = undefined; if (originalNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalNodeEnv; if (originalSecret === undefined) delete process.env.AUTH_JWT_SECRET; else process.env.AUTH_JWT_SECRET = originalSecret; });
async function start() { server = createServer(createApp()); await new Promise<void>(resolve => server!.listen(0, '127.0.0.1', resolve)); const address = server.address(); if (!address || typeof address === 'string') throw new Error('Test server did not bind'); return `http://127.0.0.1:${address.port}`; }

describe('API integration boundaries', () => {
  it('serves health without identity and rejects unauthenticated production data access', async () => {
    process.env.NODE_ENV = 'production'; process.env.AUTH_JWT_SECRET = 'a'.repeat(32);
    const baseUrl = await start();
    const health = await fetch(`${baseUrl}/api/health`);
    expect(health.status).toBe(200);
    const profile = await fetch(`${baseUrl}/api/profile`);
    expect(profile.status).toBe(401);
  });
  it('rejects malformed job query parameters before reaching persistence', async () => {
    delete process.env.NODE_ENV;
    const baseUrl = await start();
    const response = await fetch(`${baseUrl}/api/jobs?remoteStatus=unknown`, { headers: { 'x-user-id': 'integration-user' } });
    expect(response.status).toBe(400);
  });
});
