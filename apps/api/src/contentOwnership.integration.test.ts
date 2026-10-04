import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    contentIdea: { findFirst: vi.fn() },
    contentDraft: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    contentRevision: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('./prisma.js', () => ({ prisma: mocks.prisma }));

import { ContentNotFoundError, createDraft, updateDraft } from './contentService.js';

const draft = { id: 'draft-a', title: 'A draft', topic: 'A topic', body: 'Body', status: 'DRAFT', sourceFactIds: [], sourceIdeaId: 'idea-a', failureReason: null, reviewedAt: null, approvedAt: null, scheduledAt: null, publishedAt: null, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'), revisions: [{ id: 'revision-a', version: 1, body: 'Body', changeType: 'created', createdAt: new Date('2026-01-01') }], critiques: [] };

describe('content ownership boundaries', () => {
  beforeEach(() => vi.clearAllMocks());
  it('allows a user to use their own idea', async () => {
    mocks.prisma.contentIdea.findFirst.mockResolvedValueOnce({ id: 'idea-a' });
    mocks.prisma.contentDraft.create.mockResolvedValueOnce(draft);
    mocks.prisma.contentRevision.create.mockResolvedValueOnce({ id: 'revision-a' });
    mocks.prisma.contentDraft.findFirst.mockResolvedValueOnce(draft);
    await expect(createDraft('user-a', { title: 'A draft', topic: 'A topic', body: 'Body', sourceIdeaId: 'idea-a' })).resolves.toMatchObject({ id: 'draft-a' });
  });

  it.each(['user-b', 'missing'])('rejects a source idea that is not owned by the user (%s)', async () => {
    mocks.prisma.contentIdea.findFirst.mockResolvedValueOnce(null);
    await expect(createDraft('user-a', { title: 'A draft', topic: 'A topic', body: 'Body', sourceIdeaId: 'idea-b' })).rejects.toBeInstanceOf(ContentNotFoundError);
    expect(mocks.prisma.contentDraft.create).not.toHaveBeenCalled();
  });

  it('rejects updating a draft to another user\'s idea', async () => {
    mocks.prisma.contentDraft.findFirst.mockResolvedValueOnce(draft);
    mocks.prisma.contentIdea.findFirst.mockResolvedValueOnce(null);
    await expect(updateDraft('user-a', 'draft-a', { sourceIdeaId: 'idea-b' })).rejects.toBeInstanceOf(ContentNotFoundError);
    expect(mocks.prisma.contentDraft.update).not.toHaveBeenCalled();
  });
});
