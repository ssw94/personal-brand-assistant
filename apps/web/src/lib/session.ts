export type SessionUser = { id: string; email: string; plan: string; onboardingCompleted: boolean };
const tokenKey = 'pba.auth.token'; const userKey = 'pba.auth.user';
export function getToken() { return window.localStorage.getItem(tokenKey); }
export function getSessionUser(): SessionUser | null { const raw = window.localStorage.getItem(userKey); if (!raw) return null; try { return JSON.parse(raw) as SessionUser; } catch { return null; } }
export function saveSession(value: { token: string; user: SessionUser }) { window.localStorage.setItem(tokenKey, value.token); window.localStorage.setItem(userKey, JSON.stringify(value.user)); }
export function clearSession() { window.localStorage.removeItem(tokenKey); window.localStorage.removeItem(userKey); }
export function authHeaders(uid?: string, email?: string): Record<string, string> { const token = getToken(); if (token) return { Authorization: `Bearer ${token}` }; return { ...(uid ? { 'x-user-id': uid } : {}), ...(email ? { 'x-user-email': email } : {}) }; }
