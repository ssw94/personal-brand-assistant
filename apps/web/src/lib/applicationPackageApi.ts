import type { ApplicationPackage, CoverLetterRequest } from '@pba/shared';
import { getApiBaseUrl } from './config';

const uid = import.meta.env.VITE_USER_ID as string | undefined;
const email = import.meta.env.VITE_USER_EMAIL as string | undefined;
async function request<T>(path: string, init: RequestInit = {}): Promise<T> { if (!uid) throw new Error('Set VITE_USER_ID to use application packages.'); const response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers: { 'Content-Type': 'application/json', 'x-user-id': uid, ...(email ? { 'x-user-email': email } : {}), ...init.headers } }); if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error ?? 'The application package request could not be completed.'); } return response.json(); }
export const generateApplicationPackage = (body: CoverLetterRequest & { jobId: string | null }) => request<{ package: ApplicationPackage }>('/application-packages', { method: 'POST', body: JSON.stringify(body) });
export const updateCoverLetter = (id: string, content: string) => request<{ coverLetter: { id: string; content: string } }>(`/application-packages/cover-letters/${id}`, { method: 'PATCH', body: JSON.stringify({ content }) });
