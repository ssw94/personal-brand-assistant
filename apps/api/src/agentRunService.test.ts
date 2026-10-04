import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  agentRun: { create: vi.fn(), updateMany: vi.fn(), findUniqueOrThrow: vi.fn() },
  modelUsage: { create: vi.fn() },
  promptVersion: { findUnique: vi.fn(), create: vi.fn(), findUniqueOrThrow: vi.fn() },
}));
vi.mock('./prisma.js', () => ({ prisma: mocks }));

import { AgentRunTransitionError, agentRunService } from './agentRunService.js';

describe('AgentRun lifecycle ownership', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.agentRun.findUniqueOrThrow.mockResolvedValue({ id: 'run-a', userId: 'user-a', status: 'RUNNING' }); });

  it('allows only the declared queued/running transitions', async () => {
    mocks.agentRun.updateMany.mockResolvedValue({ count: 1 });
    await agentRunService.start({ userId: 'user-a' }, 'run-a');
    await agentRunService.complete({ userId: 'user-a' }, 'run-a', {});
    expect(mocks.agentRun.updateMany.mock.calls[0]![0].where).toMatchObject({ id: 'run-a', userId: 'user-a', status: 'QUEUED' });
    expect(mocks.agentRun.updateMany.mock.calls[1]![0].where).toMatchObject({ id: 'run-a', userId: 'user-a', status: 'RUNNING' });
  });

  it.each(['start', 'complete', 'fail', 'cancel'] as const)('rejects %s when the state predicate does not match', async (method) => {
    mocks.agentRun.updateMany.mockResolvedValue({ count: 0 });
    const call = method === 'start' ? agentRunService.start({ userId: 'user-a' }, 'run-a') : method === 'complete' ? agentRunService.complete({ userId: 'user-a' }, 'run-a', {}) : method === 'fail' ? agentRunService.fail({ userId: 'user-a' }, 'run-a', 'UNKNOWN', 'safe') : agentRunService.cancel({ userId: 'user-a' }, 'run-a');
    await expect(call).rejects.toBeInstanceOf(AgentRunTransitionError);
  });

  it('uses owner predicates for cancellation and stale recovery', async () => {
    mocks.agentRun.updateMany.mockResolvedValue({ count: 1 });
    await agentRunService.cancel({ userId: 'user-a' }, 'run-a');
    await agentRunService.recoverStale({ userId: 'user-a' }, new Date('2026-01-01'));
    expect(mocks.agentRun.updateMany.mock.calls[0]![0].where).toMatchObject({ id: 'run-a', userId: 'user-a', status: 'RUNNING' });
    expect(mocks.agentRun.updateMany.mock.calls[1]![0].where).toMatchObject({ userId: 'user-a', status: 'RUNNING', leaseExpiresAt: { lt: new Date('2026-01-01') } });
  });

  it('stores a generic failure message instead of sensitive provider details', async () => {
    mocks.agentRun.updateMany.mockResolvedValue({ count: 1 });
    await agentRunService.fail({ userId: 'user-a' }, 'run-a', 'UNKNOWN', JSON.stringify({ authorization: 'Bearer secret', prompt: 'private text' }));
    expect(mocks.agentRun.updateMany.mock.calls[0]![0].data.failureMessage).toBe('Operation failed.');
  });
});
