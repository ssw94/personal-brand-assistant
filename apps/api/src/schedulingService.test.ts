import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    contentDraft: { findFirst: vi.fn(), update: vi.fn() },
    linkedInAccount: { findFirst: vi.fn() },
    publishingJob: { findUnique: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  },
  assertFeatureEntitled: vi.fn(),
}));
vi.mock('./prisma.js', () => ({ prisma: mocks.prisma }));
vi.mock('./usageService.js', () => ({ assertFeatureEntitled: mocks.assertFeatureEntitled }));

import { scheduleApprovedDraft } from './schedulingService.js';

describe('scheduling idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof mocks.prisma) => unknown) => callback(mocks.prisma),
    );
    mocks.prisma.contentDraft.findFirst.mockResolvedValue({
      id: 'draft-a',
      revisions: [{ id: 'revision-a' }],
    });
    mocks.prisma.linkedInAccount.findFirst.mockResolvedValue({ id: 'account-a' });
  });

  it('replays the same schedule deterministically', async () => {
    const scheduledAt = '2099-01-01T10:00:00.000Z';
    mocks.prisma.publishingJob.findUnique.mockResolvedValue({
      id: 'job-a',
      userId: 'user-a',
      draftId: 'draft-a',
      revisionId: 'revision-a',
      accountId: 'account-a',
      scheduledAt: new Date(scheduledAt),
      timezone: 'Asia/Kolkata',
      status: 'QUEUED',
    });
    const result = await scheduleApprovedDraft('user-a', {
      draftId: 'draft-a',
      revisionId: 'revision-a',
      accountId: 'account-a',
      scheduledAt,
      timezone: 'Asia/Kolkata',
      idempotencyKey: 'schedule-a',
    });
    expect(result.id).toBe('job-a');
    expect(mocks.prisma.publishingJob.create).not.toHaveBeenCalled();
    expect(mocks.prisma.contentDraft.update).not.toHaveBeenCalled();
  });
});
