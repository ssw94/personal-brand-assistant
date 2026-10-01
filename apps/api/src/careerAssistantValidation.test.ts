import { describe, expect, it } from 'vitest';
import { assistantAskSchema, assistantAnswerSchema } from '@pba/shared';

describe('career assistant contracts', () => {
  it('requires a non-empty question and supports a nullable conversation id', () => {
    expect(assistantAskSchema.safeParse({ question: '  ', conversationId: null }).success).toBe(false);
    expect(assistantAskSchema.parse({ question: 'Which applications are active?' }).conversationId).toBeNull();
  });
  it('requires evidence to use the supported data categories', () => {
    expect(assistantAnswerSchema.safeParse({ provider: 'safe-mock', intent: 'active_applications', answer: 'Answer', evidence: [{ type: 'application', id: 'a1', label: 'Application', detail: 'Status: Applied' }] }).success).toBe(true);
    expect(assistantAnswerSchema.safeParse({ provider: 'safe-mock', intent: 'active_applications', answer: 'Answer', evidence: [{ type: 'unknown', id: 'x', label: 'x', detail: 'x' }] }).success).toBe(false);
  });
});
