import { getApiBaseUrl } from './config';
import { authHeaders, getSessionUser } from './session';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> { if (!getSessionUser()) throw new Error('Sign in is required.'); const response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...authHeaders(), ...init.headers } }); if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error ?? 'LinkedIn request failed.'); } return response.json(); }
export const listLinkedInAccounts = () => request<{ accounts: Array<{ id: string; displayName: string | null; providerMemberId: string; scopes: string[]; connectedAt: string }> }>('/linkedin/accounts');
export const startLinkedInOAuth = () => request<{ authorizationUrl: string; state: string; codeVerifier: string }>('/linkedin/oauth/start');
export const completeLinkedInOAuth = (state: string, code: string, codeVerifier: string) => request('/linkedin/oauth/callback', { method: 'POST', body: JSON.stringify({ state, code, codeVerifier }) });
