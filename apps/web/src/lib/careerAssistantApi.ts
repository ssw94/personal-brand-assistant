import type { AssistantAsk, AssistantAnswer, AssistantConversation } from '@pba/shared';
import { getApiBaseUrl } from './config';
import { authHeaders } from './session';

const uid = import.meta.env.VITE_USER_ID as string | undefined;
const email = import.meta.env.VITE_USER_EMAIL as string | undefined;
async function request<T>(path: string, init: RequestInit = {}): Promise<T> { const response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...authHeaders(uid, email), ...init.headers } }); if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error ?? 'The career assistant request could not be completed.'); } return response.json(); }
export const askCareerAssistant = (body: AssistantAsk) => request<{ conversation: AssistantConversation; answer: AssistantAnswer }>('/assistant/ask', { method: 'POST', body: JSON.stringify(body) });
export const listAssistantConversations = () => request<{ conversations: Array<{ id: string; title: string | null; updatedAt: string; messageCount: number }> }>('/assistant/conversations');
export const getAssistantConversation = (id: string) => request<{ conversation: AssistantConversation }>(`/assistant/conversations/${id}`);
