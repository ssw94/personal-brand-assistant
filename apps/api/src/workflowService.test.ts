import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    topicCandidate: { findFirst: vi.fn() },
    workflowRun: { create: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
    workflowStep: { createMany: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
  generateWriterDraft: vi.fn(),
  critiqueDraftWithAgent: vi.fn(),
  reviseDraft: vi.fn(),
}));
vi.mock('./prisma.js', () => ({ prisma: mocks.prisma }));
vi.mock('./writerService.js', () => ({ generateWriterDraft: mocks.generateWriterDraft }));
vi.mock('./criticService.js', () => ({ critiqueDraftWithAgent: mocks.critiqueDraftWithAgent }));
vi.mock('./revisionService.js', () => ({ reviseDraft: mocks.reviseDraft }));

import { startContentWorkflow } from './workflowService.js';

describe('content orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof mocks.prisma) => unknown) => callback(mocks.prisma),
    );
    mocks.prisma.topicCandidate.findFirst.mockResolvedValue({ id: 'topic-a' });
    mocks.prisma.workflowRun.create.mockResolvedValue({ id: 'workflow-a' });
    mocks.prisma.workflowStep.createMany.mockResolvedValue({});
    mocks.prisma.workflowStep.updateMany.mockResolvedValue({ count: 1 });
    mocks.prisma.workflowRun.update.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'workflow-a',
        ...data,
        steps: [],
      }),
    );
    mocks.generateWriterDraft.mockResolvedValue({ runId: 'writer-run', draft: { id: 'draft-a' } });
    mocks.critiqueDraftWithAgent.mockResolvedValue({
      runId: 'critic-run',
      critique: { id: 'critique-a' },
    });
    mocks.reviseDraft.mockResolvedValue({ runId: 'revision-run' });
  });

  it('sequences writer, critic, and revision through one orchestrator', async () => {
    await startContentWorkflow('user-a', 'topic-a');
    expect(mocks.generateWriterDraft).toHaveBeenCalledBefore(mocks.critiqueDraftWithAgent);
    expect(mocks.critiqueDraftWithAgent).toHaveBeenCalledBefore(mocks.reviseDraft);
    expect(mocks.prisma.workflowStep.createMany).toHaveBeenCalledWith({
      data: [
        { userId: 'user-a', runId: 'workflow-a', name: 'WRITER' },
        { userId: 'user-a', runId: 'workflow-a', name: 'CRITIC' },
        { userId: 'user-a', runId: 'workflow-a', name: 'REVISION' },
      ],
    });
  });
});
