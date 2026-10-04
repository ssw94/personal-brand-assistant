import { describe, expect, it } from 'vitest';
import { apiErrorSchema, auditEventSchema, contentLifecycleStateSchema, idempotencyKeySchema } from '@pba/shared';

describe('Phase 1 shared contracts', () => {
  it('accepts the explicit content lifecycle states', () => {
    expect(contentLifecycleStateSchema.parse('APPROVED')).toBe('APPROVED');
    expect(contentLifecycleStateSchema.safeParse('PUBLISHING').success).toBe(false);
  });

  it('rejects credentials in audit metadata', () => {
    expect(auditEventSchema.safeParse({ ownerUserId: 'u1', actorUserId: 'u1', resourceType: 'ContentDraft', resourceId: 'd1', action: 'read', result: 'success', metadata: { accessToken: 'redacted' } }).success).toBe(false);
    expect(auditEventSchema.safeParse({ ownerUserId: 'u1', actorUserId: 'u1', resourceType: 'ContentDraft', resourceId: 'd1', action: 'read', result: 'success', metadata: { provider: { accessToken: 'redacted' } } }).success).toBe(false);
    expect(auditEventSchema.safeParse({ ownerUserId: 'u1', actorUserId: 'u1', resourceType: 'ContentDraft', resourceId: 'd1', action: 'read', result: 'success', metadata: { detail: 'x'.repeat(16_385) } }).success).toBe(false);
  });

  it('validates idempotency keys and stable API errors', () => {
    expect(idempotencyKeySchema.safeParse('request-1234').success).toBe(true);
    expect(idempotencyKeySchema.safeParse('short').success).toBe(false);
    expect(apiErrorSchema.parse({ error: 'Not found', code: 'NOT_FOUND' })).toEqual({ error: 'Not found', code: 'NOT_FOUND' });
  });
});
