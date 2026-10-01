import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

export class AuthenticationError extends Error { constructor(message = 'Authentication required') { super(message); this.name = 'AuthenticationError'; } }
export type AuthenticatedIdentity = { userId: string; email?: string };
function verifyBearer(token: string, secret: string): AuthenticatedIdentity {
  const parts = token.split('.'); const encodedHeader = parts[0]; const encodedPayload = parts[1]; const signature = parts[2];
  if (!encodedHeader || !encodedPayload || !signature) throw new AuthenticationError('Invalid bearer token');
  let header: { alg?: string; typ?: string }; let payload: { sub?: unknown; email?: unknown; exp?: unknown; iss?: unknown };
  try { header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8')) as typeof header; payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as typeof payload; } catch { throw new AuthenticationError('Invalid bearer token'); }
  if (header.alg !== 'HS256' || header.typ !== 'JWT' || typeof payload.sub !== 'string' || !payload.sub.trim()) throw new AuthenticationError('Invalid bearer token');
  const expected = createHmac('sha256', secret).update(`${encodedHeader}.${encodedPayload}`).digest(); const received = Buffer.from(signature, 'base64url');
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) throw new AuthenticationError('Invalid bearer token');
  if (typeof payload.exp === 'number' && payload.exp <= Math.floor(Date.now() / 1000)) throw new AuthenticationError('Bearer token has expired');
  if (process.env.AUTH_JWT_ISSUER && payload.iss !== process.env.AUTH_JWT_ISSUER) throw new AuthenticationError('Invalid bearer token issuer');
  return { userId: payload.sub.trim(), ...(typeof payload.email === 'string' && payload.email.trim() ? { email: payload.email.trim() } : {}) };
}
export function authenticateRequest(request: Request): AuthenticatedIdentity {
  const authorization = request.header('authorization');
  if (authorization) { const [scheme, token] = authorization.split(' '); const secret = process.env.AUTH_JWT_SECRET; if (scheme?.toLowerCase() !== 'bearer' || !token || !secret) throw new AuthenticationError('A valid bearer token is required'); return verifyBearer(token, secret); }
  if (process.env.NODE_ENV === 'production' || process.env.AUTH_ALLOW_IDENTITY_HEADERS === 'false') throw new AuthenticationError('A bearer token is required outside local development');
  const userId = request.header('x-user-id')?.trim(); if (!userId) throw new AuthenticationError('x-user-id header is required for local development');
  const email = request.header('x-user-email')?.trim(); return { userId, ...(email ? { email } : {}) };
}
export function authenticationErrorStatus(error: unknown) { return error instanceof AuthenticationError ? 401 : 500; }
export function assertProductionAuthConfig() { if (process.env.NODE_ENV === 'production' && (!process.env.AUTH_JWT_SECRET || process.env.AUTH_JWT_SECRET.length < 32)) throw new Error('AUTH_JWT_SECRET must be at least 32 characters in production'); if (process.env.NODE_ENV === 'production' && process.env.AUTH_ALLOW_IDENTITY_HEADERS === 'true') throw new Error('AUTH_ALLOW_IDENTITY_HEADERS must be false in production'); }
