import { describe, expect, it } from 'vitest';
import { interviewPreparationRequestSchema, interviewPreparationUpdateSchema } from '@pba/shared';

describe('interview preparation validation', () => {
  it('accepts a valid stage and optional schedule', () => {
    expect(interviewPreparationRequestSchema.safeParse({ stage: 'System Design', scheduledAt: '2026-10-10T10:00:00.000Z', notes: 'Review architecture tradeoffs.' }).success).toBe(true);
  });
  it('rejects unknown stages and oversized answers', () => {
    expect(interviewPreparationRequestSchema.safeParse({ stage: 'Guaranteed Questions' }).success).toBe(false);
    expect(interviewPreparationUpdateSchema.safeParse({ answers: [{ questionId: 'q1', answer: 'x'.repeat(5001) }] }).success).toBe(false);
  });
});
