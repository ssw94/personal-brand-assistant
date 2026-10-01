import type { AssistantAsk, AssistantAnswer, AssistantConversation } from '@pba/shared';
import { getApiBaseUrl } from './config';

const uid = import.meta.env.VITE_USER_ID as string | undefined;
const email = import.meta.env.VITE_USER_EMAIL as string | undefined;
async function request<T>(path: string, init: RequestInit = {}): Promise<T> { if (!uid) throw new Error('Set VITE_USER_ID to use the career assistant.'); const response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers: { 'Content-Type': 'application/json', 'x-user-id': uid, ...(email ? { 'x-user-email': email } : {}), ...init.headers } }); if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error ?? 'The career assistant request could not be completed.'); } return response.json(); }
export const askCareerAssistant = (body: AssistantAsk) => request<{ conversation: AssistantConversation; answer: AssistantAnswer }>('/assistant/ask', { method: 'POST', body: JSON.stringify(body) });
export const listAssistantConversations = () => request<{ conversations: Array<{ id: string; title: string | null; updatedAt: string; messageCount: number }> }>('/assistant/conversations');
export const getAssistantConversation = (id: string) => request<{ conversation: AssistantConversation }>(`/assistant/conversations/${id}`);
