import { getApiBaseUrl } from './config';
import { authHeaders } from './session';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...init.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? 'The request could not be completed.');
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export type MemoryFact = {
  id: string;
  category: string;
  text: string;
  sourceType: string;
  reviewState: string;
  confidence: number;
  updatedAt: string;
};
export type TopicCandidate = {
  id: string;
  title: string;
  angle: string;
  rationale: string;
  status: string;
  createdAt: string;
};
export type Metric = {
  id: string;
  publishedPostId: string;
  metricName: string;
  value: number;
  observedAt: string;
  provider: string;
  capability: string;
};
export type Insight = {
  id: string;
  summary: string;
  confidence: number;
  status: string;
  evidence: unknown;
  feedback?: { guidance: string; status: string } | null;
};

export const listMemoryFacts = () =>
  request<{ facts: MemoryFact[] }>('/professional-intelligence/memory');
export const extractMemory = () =>
  request<{ candidates: MemoryFact[] }>('/professional-intelligence/memory/extract', {
    method: 'POST',
  });
export const reviewMemory = (id: string, decision: 'VERIFIED' | 'REJECTED') =>
  request<{ fact: MemoryFact }>(`/professional-intelligence/memory/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision }),
  });
export const getWritingStyle = () =>
  request<{
    profile: {
      tone: string;
      formality: string;
      sentenceLength: string;
      preferences: string[];
    } | null;
  }>('/professional-intelligence/style');
export const listTopics = () => request<{ candidates: TopicCandidate[] }>('/topics/candidates');
export const generateTopics = (focus: string) =>
  request<{ candidates: TopicCandidate[] }>('/topics/runs', {
    method: 'POST',
    body: JSON.stringify({ focus, count: 5 }),
  });
export const reviewTopic = (id: string, decision: 'SELECTED' | 'REJECTED') =>
  request<{ candidate: TopicCandidate }>(`/topics/candidates/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision }),
  });
export const listMetrics = () => request<{ metrics: Metric[] }>('/analytics/metrics');
export const listInsights = () => request<{ insights: Insight[] }>('/analytics-intelligence');
export const generateInsights = () =>
  request<{ insights: Insight[] }>('/analytics-intelligence/generate', { method: 'POST' });
export const decideInsight = (id: string, decision: 'ACCEPTED' | 'DISMISSED') =>
  request<{ id: string; status: string }>(`/analytics-intelligence/${id}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision }),
  });
