import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  tx: {
    user: { findUnique: vi.fn() },
    contentDraft: { findFirst: vi.fn() },
    contentRevision: { findFirst: vi.fn() },
    contentIdea: { findFirst: vi.fn() },
    contentApproval: { create: vi.fn() },
    auditEvent: { create: vi.fn() },
  },
  prisma: { $transaction: vi.fn() },
}));

vi.mock('./prisma.js', () => ({ prisma: mocks.prisma }));

import { createAuditEvent, recordApprovalAudit } from './auditEventService.js';

const event = { ownerUserId: 'user-a', actorUserId: 'user-a', resourceType: 'ContentDraft', resourceId: 'draft-a', action: 'read', result: 'success', metadata: { revisionId: 'revision-a' } };

describe('audit authorization and consistency', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.prisma.$transaction.mockImplementation(async (callback: (tx: typeof mocks.tx) => unknown) => callback(mocks.tx)); });

  it('allows an authenticated owner to audit an owned resource', async () => {
    mocks.tx.user.findUnique.mockResolvedValue({ id: 'user-a' });
    mocks.tx.contentDraft.findFirst.mockResolvedValue({ id: 'draft-a' });
    mocks.tx.auditEvent.create.mockResolvedValue({ id: 'audit-a' });
    await expect(createAuditEvent(event)).resolves.toEqual({ id: 'audit-a' });
  });

  it('rejects an invalid or cross-user actor/resource', async () => {
    mocks.tx.user.findUnique.mockResolvedValue(null);
    await expect(createAuditEvent(event)).rejects.toThrow('not authorized');
    mocks.tx.user.findUnique.mockResolvedValue({ id: 'user-a' });
    mocks.tx.contentDraft.findFirst.mockResolvedValue(null);
    await expect(createAuditEvent(event)).rejects.toThrow('not owned');
  });

  it('requires approval revisions to belong to the owned draft', async () => {
    mocks.tx.contentDraft.findFirst.mockResolvedValue({ id: 'draft-a' });
    mocks.tx.contentRevision.findFirst.mockResolvedValue(null);
    await expect(recordApprovalAudit({ ownerUserId: 'user-a', actorUserId: 'user-a', draftId: 'draft-a', revisionId: 'revision-b', decision: 'APPROVED' })).rejects.toThrow('revision not found');
    expect(mocks.tx.contentApproval.create).not.toHaveBeenCalled();
  });
});
