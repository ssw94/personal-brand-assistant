import { getApiBaseUrl } from './config';
const uid = import.meta.env.VITE_USER_ID as string | undefined; const email = import.meta.env.VITE_USER_EMAIL as string | undefined;
async function request<T>(path: string, init: RequestInit = {}): Promise<T> { if (!uid) throw new Error('Set VITE_USER_ID to use content persistence.'); const response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers: { 'Content-Type': 'application/json', 'x-user-id': uid, ...(email ? { 'x-user-email': email } : {}), ...init.headers } }); if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error ?? 'The request could not be completed.'); } return response.status === 204 ? (undefined as T) : response.json(); }
export type Draft = { id: string; title: string; topic: string; body: string; status: string; sourceFactIds: string[]; sourceIdeaId: string | null; revisions: Array<{ id: string; version: number; body: string; changeType: string; createdAt: string }>; critiques: Array<{ provider: string; summary: string; strengths: string[]; improvements: string[]; factStatus: 'critique_only' }> };
export const getStrategy = () => request<{ strategy: { targetAudience: string; writingVoice: string; postingFrequency: string; recurringThemes: string[] } | null }>('/content/strategy');
export const saveStrategy = (body: unknown) => request('/content/strategy', { method: 'PUT', body: JSON.stringify(body) });
export const listIdeas = () => request<{ ideas: Array<{ id: string; title: string; prompt: string; status: string }> }>('/content/ideas');
export const createIdea = (body: unknown) => request('/content/ideas', { method: 'POST', body: JSON.stringify(body) });
export const listDrafts = () => request<{ drafts: Draft[] }>('/content/drafts');
export const generateDraft = (body: unknown) => request<{ id: string }>('/content/drafts/generate', { method: 'POST', body: JSON.stringify(body) });
export const updateDraft = (id: string, body: unknown) => request<{ draft: Draft }>(`/content/drafts/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const critiqueDraft = (id: string) => request<{ critique: Draft['critiques'][number] }>(`/content/drafts/${id}/critique`, { method: 'POST' });
export const transformDraft = (id: string, action: string) => request<{ draft: Draft }>(`/content/drafts/${id}/transform`, { method: 'POST', body: JSON.stringify({ action }) });
