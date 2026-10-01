import { describe, expect, it } from 'vitest';
import { profileDetailsSchema, projectSchema } from '@pba/shared';
import { profileErrorStatus } from './profileRoutes.js';

describe('profile validation and API errors', () => {
  it('requires the minimum professional identity', () => {
    const result = profileDetailsSchema.safeParse({ firstName: '', professionalTitle: '', yearsOfExperience: 2, targetRoles: [], preferredLocations: [], remotePreference: 'remote' });
    expect(result.success).toBe(false);
  });
  it('accepts an honest profile with optional fields omitted', () => {
    const result = profileDetailsSchema.parse({ firstName: 'Ada', professionalTitle: 'Software Engineer', yearsOfExperience: 5, targetRoles: ['Platform Engineer'], preferredLocations: ['Remote'], remotePreference: 'remote' });
    expect(result.summary).toBe('');
  });
  it('rejects malformed project URLs and keeps unknown errors internal', () => {
    expect(projectSchema.safeParse({ name: 'Compiler', url: 'not-a-url' }).success).toBe(false);
    expect(profileErrorStatus(new Error('bad'))).toBe(500);
  });
});
