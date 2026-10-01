import { describe, expect, it } from 'vitest';
import { applicationPackageRequestSchema, coverLetterUpdateSchema } from '@pba/shared';

describe('application package validation', () => {
  it('requires a real resume and sufficiently detailed job description', () => {
    expect(applicationPackageRequestSchema.safeParse({ resumeId: 'r1', company: 'Acme', role: 'Engineer', jobDescription: 'Short' }).success).toBe(false);
    expect(applicationPackageRequestSchema.safeParse({ resumeId: 'r1', company: 'Acme', role: 'Engineer', jobDescription: 'Build reliable services with TypeScript and collaborate with a platform engineering team.' }).success).toBe(true);
  });
  it('requires meaningful edited cover letter content', () => {
    expect(coverLetterUpdateSchema.safeParse({ content: 'too short' }).success).toBe(false);
    expect(coverLetterUpdateSchema.safeParse({ content: 'A '.repeat(50) }).success).toBe(true);
  });
});
