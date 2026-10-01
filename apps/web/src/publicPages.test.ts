import { describe, expect, it } from 'vitest';
import { planCatalog } from '@pba/shared';

describe('public SaaS catalog', () => {
  it('keeps one centralized plan catalog with all plan ids', () => {
    expect(planCatalog.map(plan => plan.id)).toEqual(['FREE', 'CREATOR', 'PRO', 'EXPERT', 'TEAM']);
    expect(planCatalog.find(plan => plan.id === 'FREE')?.price).toBe(0);
  });
  it('does not advertise publishing as universally available', () => {
    expect(planCatalog.every(plan => plan.publishing === 'Not included' || plan.publishing === 'Provider-dependent')).toBe(true);
  });
});
