import type { ResumeDocument } from '@pba/shared';
import type { ProfileRecord } from './profileApi';

import { getApiBaseUrl } from './config';
const uid = import.meta.env.VITE_USER_ID as string | undefined;
const email = import.meta.env.VITE_USER_EMAIL as string | undefined;
export type ResumeListItem = { id: string; title: string; createdAt: string; updatedAt: string; latestVersion: { id: string; version: number } | null };
export type ResumeRecord = ResumeListItem & { latestVersion: { id: string; version: number; content: ResumeDocument; createdAt: string } | null; profile: ProfileRecord | null };
async function request<T>(path: string, init: RequestInit = {}): Promise<T> { if (!uid) throw new Error('Set VITE_USER_ID to use resume persistence.'); const response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers: { 'Content-Type': 'application/json', 'x-user-id': uid, ...(email ? { 'x-user-email': email } : {}), ...init.headers } }); if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error ?? 'The request could not be completed.'); } return response.status === 204 ? (undefined as T) : response.json(); }
export const listResumes = () => request<{ resumes: ResumeListItem[] }>('/resumes');
export const createResume = (title: string) => request<{ resume: ResumeRecord }>('/resumes', { method: 'POST', body: JSON.stringify({ title }) });
export const getResume = (id: string) => request<{ resume: ResumeRecord }>(`/resumes/${id}`);
export const autosaveResume = (id: string, title: string, content: ResumeDocument) => request<{ resume: ResumeRecord }>(`/resumes/${id}/draft`, { method: 'PATCH', body: JSON.stringify({ title, content }) });
export const saveResumeVersion = (id: string, title: string, content: ResumeDocument) => request<{ resume: ResumeRecord }>(`/resumes/${id}/versions`, { method: 'POST', body: JSON.stringify({ title, content }) });
export const duplicateResume = (id: string) => request<{ resume: ResumeRecord }>(`/resumes/${id}/duplicate`, { method: 'POST' });
export const deleteResume = (id: string) => request<void>(`/resumes/${id}`, { method: 'DELETE' });
