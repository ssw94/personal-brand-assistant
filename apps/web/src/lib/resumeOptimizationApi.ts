import type { OptimizationResult, OptimizationSuggestion } from '@pba/shared';
import { type ResumeRecord } from './resumeApi';

const base = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
const uid = import.meta.env.VITE_USER_ID as string | undefined;
const email = import.meta.env.VITE_USER_EMAIL as string | undefined;
export type OptimizationRecord = { id: string; resumeId: string; jobDescription: string; provider: string; result: OptimizationResult; createdAt: string; updatedAt: string };
async function request<T>(path: string, init: RequestInit = {}): Promise<T> { if (!uid) throw new Error('Set VITE_USER_ID to use optimization.'); const response = await fetch(`${base}${path}`, { ...init, headers: { 'Content-Type': 'application/json', 'x-user-id': uid, ...(email ? { 'x-user-email': email } : {}), ...init.headers } }); if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error ?? 'The optimization request could not be completed.'); } return response.status === 204 ? (undefined as T) : response.json(); }
export const createOptimization = (resumeId: string, jobDescription: string) => request<{ optimization: OptimizationRecord }>(`/resumes/${resumeId}/optimizations`, { method: 'POST', body: JSON.stringify({ jobDescription }) });
export const regenerateOptimization = (resumeId: string, optimizationId: string) => request<{ optimization: OptimizationRecord }>(`/resumes/${resumeId}/optimizations/${optimizationId}/regenerate`, { method: 'POST' });
export const updateSuggestion = (resumeId: string, optimizationId: string, suggestionId: string, status: OptimizationSuggestion['status']) => request<{ optimization: OptimizationRecord }>(`/resumes/${resumeId}/optimizations/${optimizationId}/suggestions/${suggestionId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const applyOptimization = (resumeId: string, optimizationId: string) => request<{ resume: ResumeRecord }>(`/resumes/${resumeId}/optimizations/${optimizationId}/apply`, { method: 'POST' });
