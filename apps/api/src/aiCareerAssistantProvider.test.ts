import { describe, expect, it } from 'vitest';
import { SafeMockCareerAssistantProvider, type CareerAssistantContext } from './aiCareerAssistantProvider.js';

const context: CareerAssistantContext = { profile: { targetRoles: ['Platform Engineer'], skills: ['TypeScript', 'Kubernetes'], headline: 'Platform engineer', summary: 'Builds reliable services.' }, jobs: [{ id: 'job-1', title: 'Platform Engineer', company: 'Acme', description: 'Build Kubernetes services and improve observability.', skills: ['TypeScript', 'Kubernetes'] }, { id: 'job-2', title: 'Backend Engineer', company: 'Beta', description: 'Build APIs with TypeScript.', skills: ['TypeScript'] }], applications: [{ id: 'app-1', title: 'Platform Engineer', company: 'Acme', status: 'Applied', followUpDate: '2026-09-30T00:00:00.000Z', interviewDate: null, resumeTitle: 'Platform resume', resumeVersion: 2 }], resumes: [{ id: 'resume-1', title: 'Platform resume', version: 2, text: 'Platform engineer' }], interviews: [{ applicationId: 'app-1', stage: 'Technical Interview', topics: ['kubernetes'], checklist: ['Review architecture'] }], now: '2026-10-01T12:00:00.000Z' };

describe('grounded career assistant provider', () => {
  it('answers follow-up questions from actual application records with evidence', async () => {
    const result = await new SafeMockCareerAssistantProvider().answer('Which applications need follow-up?', context);
    expect(result.intent).toBe('follow_up');
    expect(result.answer).toContain('Platform Engineer at Acme');
    expect(result.evidence[0]?.id).toBe('app-1');
  });
  it('uses saved interview preparation and does not promise questions', async () => {
    const result = await new SafeMockCareerAssistantProvider().answer('What should I prepare for the Acme interview?', context);
    expect(result.intent).toBe('interview_preparation');
    expect(result.answer).toContain('kubernetes');
    expect(result.evidence.length).toBeGreaterThan(0);
  });
  it('states when a recommendation cannot be confirmed', async () => {
    const result = await new SafeMockCareerAssistantProvider().answer('Which resume should I use for an unknown company?', { ...context, applications: [], resumes: [] });
    expect(result.answer).toContain('No resumes are recorded');
  });
});
