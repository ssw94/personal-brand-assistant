import { describe, expect, it } from 'vitest';
import { canTransition } from './contentService.js';

describe('content workflow', () => {
  it('allows review and approval in order', () => { expect(canTransition('DRAFT', 'REVIEW')).toBe(true); expect(canTransition('REVIEW', 'APPROVED')).toBe(true); expect(canTransition('DRAFT', 'APPROVED')).toBe(false); });
  it('does not allow publishing from an unapproved draft', () => { expect(canTransition('DRAFT', 'PUBLISHED')).toBe(false); expect(canTransition('APPROVED', 'SCHEDULED')).toBe(true); expect(canTransition('PUBLISHED', 'DRAFT')).toBe(false); });
  it('covers the remaining lifecycle boundaries', () => {
    expect(canTransition('APPROVED', 'PUBLISHING')).toBe(true);
    expect(canTransition('PUBLISHING', 'PUBLISHED')).toBe(true);
    expect(canTransition('PUBLISHING', 'PUBLISH_FAILED')).toBe(true);
    expect(canTransition('PUBLISH_FAILED', 'PUBLISHING')).toBe(true);
    expect(canTransition('ARCHIVED', 'DRAFT')).toBe(false);
    expect(canTransition('PUBLISHED', 'APPROVED')).toBe(false);
  });
});
