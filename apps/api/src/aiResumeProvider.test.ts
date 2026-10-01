import { describe, expect, it } from 'vitest';
import { SafeMockResumeOptimizer } from './aiResumeProvider.js';

describe('safe resume optimization provider', () => {
  it('separates suggestions from supplied facts and flags missing terms conditionally', async () => {
    const result = await new SafeMockResumeOptimizer().optimize({ jobDescription: 'We need a platform engineer with Kubernetes and observability experience.', summary: 'Software engineer building reliable services.', facts: [{ id: 'experience:one', text: 'Backend engineer at Acme building reliable services.' }, { id: 'skill:one', text: 'TypeScript' }] });
    expect(result.provider).toBe('safe-mock');
    expect(result.suggestions.every(suggestion => suggestion.factStatus === 'suggestion')).toBe(true);
    const missing = result.suggestions.find(suggestion => suggestion.category === 'missing_skill');
    expect(missing?.suggestedText).toContain('only if it accurately reflects');
    expect(missing?.sourceFactIds).toEqual([]);
  });
  it('does not invent metrics or responsibilities in bullet suggestions', async () => {
    const result = await new SafeMockResumeOptimizer().optimize({ jobDescription: 'Senior software engineer responsible for scalable systems.', summary: '', facts: [{ id: 'experience:one', text: 'Engineer at Acme.' }] });
    const bullet = result.suggestions.find(suggestion => suggestion.category === 'bullet_improvement');
    expect(bullet?.suggestedText).toContain('Add a real metric only when you can verify it');
    expect(bullet?.sourceFactIds).toEqual(['experience:one']);
  });
});
