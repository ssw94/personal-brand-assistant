import { afterEach, describe, expect, it } from 'vitest';
import { assertResearchUrlAllowed, ResearchUrlPolicyError } from './researchService.js';

describe('research source safety boundary', () => {
  const previous = process.env.RESEARCH_ALLOWED_HOSTS;
  afterEach(() => { if (previous === undefined) delete process.env.RESEARCH_ALLOWED_HOSTS; else process.env.RESEARCH_ALLOWED_HOSTS = previous; });

  it('rejects non-HTTPS sources before network access', async () => {
    process.env.RESEARCH_ALLOWED_HOSTS = 'example.com';
    await expect(assertResearchUrlAllowed('http://example.com/article')).rejects.toBeInstanceOf(ResearchUrlPolicyError);
  });

  it('rejects internal and non-allowlisted hosts', async () => {
    process.env.RESEARCH_ALLOWED_HOSTS = 'example.com';
    await expect(assertResearchUrlAllowed('https://localhost/article')).rejects.toThrow('Internal research hosts');
    await expect(assertResearchUrlAllowed('https://other.example/article')).rejects.toThrow('not allowlisted');
  });

  it('requires an explicit host allowlist', async () => {
    delete process.env.RESEARCH_ALLOWED_HOSTS;
    await expect(assertResearchUrlAllowed('https://example.com/article')).rejects.toThrow('not allowlisted');
  });
});
