import { describe, expect, it } from 'vitest';
import { canTransition } from './contentService.js';

describe('content workflow', () => {
  it('allows review and approval in order', () => { expect(canTransition('DRAFT', 'REVIEW')).toBe(true); expect(canTransition('REVIEW', 'APPROVED')).toBe(true); expect(canTransition('DRAFT', 'APPROVED')).toBe(false); });
  it('does not allow publishing from an unapproved draft', () => { expect(canTransition('DRAFT', 'PUBLISHED')).toBe(false); expect(canTransition('APPROVED', 'SCHEDULED')).toBe(true); expect(canTransition('PUBLISHED', 'DRAFT')).toBe(false); });
});
