import { describe, expect, it } from 'vitest';
import { SafeMockCoverLetterProvider } from './aiCoverLetterProvider.js';

describe('safe cover letter provider', () => {
  it('only grounds tailored content in supplied facts', async () => {
    const result = await new SafeMockCoverLetterProvider().generate({ company: 'Acme', role: 'Platform Engineer', jobDescription: 'Build reliable Kubernetes services and improve observability across teams.', candidateName: 'Alex', summary: 'Software engineer building backend services.', facts: [{ id: 'skill:1', text: 'TypeScript' }, { id: 'experience:1', text: 'Platform engineer at Example. Built reliable services.' }] });
    expect(result.provider).toBe('safe-mock');
    expect(result.factStatus).toBe('derived_from_user_facts');
    expect(result.sourceFactIds).toEqual(['experience:1']);
    expect(result.content).not.toContain('Kubernetes');
    expect(result.content).toContain('reliable services');
  });
  it('keeps a useful truthful fallback when no facts match', async () => {
    const result = await new SafeMockCoverLetterProvider().generate({ company: 'Acme', role: 'Designer', jobDescription: 'Design accessible interfaces for a product team with strong research practice.', candidateName: '', summary: '', facts: [] });
    expect(result.content).toContain('experience documented in my resume');
    expect(result.sourceFactIds).toEqual([]);
  });
});
