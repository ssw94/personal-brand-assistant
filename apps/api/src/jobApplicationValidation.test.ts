import { describe, expect, it } from 'vitest';
import { applicationCreateSchema, applicationStatusSchema, jobSchema, savedJobSchema } from '@pba/shared';
import { createJobSourceProvider } from './jobSourceProvider.js';

describe('job and application foundation', () => {
  it('validates structured job metadata without requiring unavailable fields', () => {
    const job = jobSchema.parse({ title: 'Software Engineer', company: 'Example', remoteStatus: 'hybrid', skills: ['TypeScript'] });
    expect(job.description).toBe('');
    expect(savedJobSchema.parse({}).priority).toBe('medium');
  });
  it('keeps application statuses constrained to the product workflow', () => {
    expect(applicationStatusSchema.safeParse('Technical Interview').success).toBe(true);
    expect(applicationStatusSchema.safeParse('Hired').success).toBe(false);
    expect(applicationCreateSchema.safeParse({ jobId: 'job-1' }).success).toBe(true);
  });
  it('does not perform external job scraping', async () => {
    const provider = createJobSourceProvider();
    expect(provider.name).toBe('manual');
    expect(await provider.search('platform engineer')).toEqual([]);
  });
});
