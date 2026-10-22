import type { InterviewPreparationRequest, InterviewPreparationResponse, InterviewPreparationUpdate } from '@pba/shared';
import { getApiBaseUrl } from './config';
import { authHeaders } from './session';

const uid = import.meta.env.VITE_USER_ID as string | undefined;
const email = import.meta.env.VITE_USER_EMAIL as string | undefined;
async function request<T>(path: string, init: RequestInit = {}): Promise<T> { const response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...authHeaders(uid, email), ...init.headers } }); if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error ?? 'The interview preparation request could not be completed.'); } return response.json(); }
export const getInterviewPreparation = (applicationId: string) => request<{ interview: InterviewPreparationResponse | null }>(`/applications/${applicationId}/interview-preparation`);
export const generateInterviewPreparation = (applicationId: string, body: InterviewPreparationRequest) => request<{ interview: InterviewPreparationResponse }>(`/applications/${applicationId}/interview-preparation`, { method: 'POST', body: JSON.stringify(body) });
export const updateInterviewPreparation = (applicationId: string, body: InterviewPreparationUpdate) => request<{ interview: InterviewPreparationResponse }>(`/applications/${applicationId}/interview-preparation`, { method: 'PATCH', body: JSON.stringify(body) });
