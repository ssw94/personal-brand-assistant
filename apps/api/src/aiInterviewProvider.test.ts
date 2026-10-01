import { describe, expect, it } from 'vitest';
import { SafeMockInterviewProvider } from './aiInterviewProvider.js';

describe('safe interview preparation provider', () => {
  it('labels output as preparation and grounds resume questions in supplied facts', async () => {
    const result = await new SafeMockInterviewProvider().prepare({ role: 'Platform Engineer', company: 'Acme', stage: 'Technical Interview', jobDescription: 'Build reliable Kubernetes services and improve observability for platform teams.', facts: [{ id: 'experience:one', text: 'Platform engineer at Example. Built reliable services.' }] });
    expect(result.materialType).toBe('preparation_material');
    expect(result.disclaimer).toContain('not guaranteed');
    expect(result.resumeQuestions[0]?.sourceFactIds).toEqual(['experience:one']);
    expect(result.technicalTopics).toContain('kubernetes');
  });
  it('does not invent candidate facts when the profile is empty', async () => {
    const result = await new SafeMockInterviewProvider().prepare({ role: 'Engineer', company: 'Acme', stage: 'Behavioral Interview', jobDescription: 'Collaborate with a product team to deliver quality software and communicate clearly.', facts: [] });
    expect(result.resumeQuestions).toEqual([]);
    expect(result.roleSpecificQuestions.every(item => item.sourceFactIds.length === 0)).toBe(true);
  });
});
