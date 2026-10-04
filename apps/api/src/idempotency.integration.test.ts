import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

type CompositeWhere = { where: { userId_key_operation: { userId: string; key: string; operation: string } } };
type CreateArgs = { data: { userId: string; key: string; operation: string; requestHash: string; expiresAt: Date } };
type ReservationRecord = CreateArgs['data'] & { id: string; status: 'IN_PROGRESS'; responseStatus: null; responseBody: null; resourceId: null; errorCode: null };

const state = vi.hoisted(() => new Map<string, ReservationRecord>());
const mocks = vi.hoisted(() => ({
  prisma: {
    idempotencyRecord: {
      findUnique: vi.fn(async ({ where }: CompositeWhere) => { await new Promise((resolve) => setTimeout(resolve, 0)); return state.get(`${where.userId_key_operation.userId}:${where.userId_key_operation.key}:${where.userId_key_operation.operation}`) ?? null; }),
      create: vi.fn(async ({ data }: CreateArgs) => {
        const key = `${data.userId}:${data.key}:${data.operation}`;
        if (state.has(key)) throw new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: '6.19.0' });
        const record: ReservationRecord = { id: `${state.size + 1}`, ...data, status: 'IN_PROGRESS', responseStatus: null, responseBody: null, resourceId: null, errorCode: null };
        state.set(key, record);
        return record;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<ReservationRecord> }) => {
        const record = [...state.values()].find((candidate) => candidate.id === where.id);
        if (!record) throw new Error('Missing idempotency record.');
        Object.assign(record, data);
        return record;
      }),
      updateMany: vi.fn(async () => ({ count: 0 })),
    },
  },
}));

vi.mock('./prisma.js', () => ({ prisma: mocks.prisma }));

import { reserveIdempotency, withIdempotency } from './idempotency.js';

describe('idempotency concurrency boundaries', () => {
  beforeEach(() => { state.clear(); vi.clearAllMocks(); });

  it('allows only one concurrent reservation for the same user/key/operation', async () => {
    const results = await Promise.all([
      reserveIdempotency('user-a', 'request-1234', 'content.create', { title: 'A' }),
      reserveIdempotency('user-a', 'request-1234', 'content.create', { title: 'A' }),
    ]);
    expect(results.filter((result) => result.kind === 'new')).toHaveLength(1);
    expect(results.filter((result) => result.kind === 'in_progress')).toHaveLength(1);
  });

  it('scopes equivalent keys by user and operation', async () => {
    await expect(reserveIdempotency('user-a', 'request-1234', 'content.create', { title: 'A' })).resolves.toMatchObject({ kind: 'new' });
    await expect(reserveIdempotency('user-b', 'request-1234', 'content.create', { title: 'A' })).resolves.toMatchObject({ kind: 'new' });
    await expect(reserveIdempotency('user-a', 'request-1234', 'content.update', { title: 'A' })).resolves.toMatchObject({ kind: 'new' });
  });

  it('records failures and deterministically replays them without rerunning work', async () => {
    await expect(withIdempotency('user-a', 'request-1234', 'content.create', { title: 'A' }, async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    const execute = vi.fn(async () => ({ status: 201, body: { created: true } }));
    await expect(withIdempotency('user-a', 'request-1234', 'content.create', { title: 'A' }, execute)).resolves.toMatchObject({ status: 500, replayed: true });
    expect(execute).not.toHaveBeenCalled();
  });
});
