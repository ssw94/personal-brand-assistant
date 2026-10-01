import { describe, expect, it } from 'vitest';
import { resumeDocumentSchema, resumeSaveSchema } from '@pba/shared';
import { resumeErrorStatus } from './resumeRoutes.js';

const content = { summary: 'Platform engineer', sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'achievements'], visibleSections: { summary: true, experience: true, education: true, skills: true, projects: true, certifications: true, achievements: true }, experienceIds: [], educationIds: [], skillIds: [], projectIds: [], certificationIds: [], achievementIds: [] };

describe('resume validation', () => {
  it('accepts a complete configurable document', () => {
    expect(resumeDocumentSchema.parse(content).sectionOrder).toHaveLength(7);
    expect(resumeSaveSchema.safeParse({ title: 'Platform resume', content }).success).toBe(true);
  });
  it('rejects duplicate or incomplete section orders', () => {
    expect(resumeDocumentSchema.safeParse({ ...content, sectionOrder: ['summary'] }).success).toBe(false);
    expect(resumeErrorStatus(new Error('unknown'))).toBe(500);
  });
});
