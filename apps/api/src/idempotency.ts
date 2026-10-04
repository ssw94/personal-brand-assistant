import { createHash } from 'node:crypto';
import { idempotencyKeySchema } from '@pba/shared';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

export type IdempotencyReservation =
  | { kind: 'new'; id: string }
  | { kind: 'replay'; id: string; status: 'COMPLETED' | 'FAILED'; responseStatus: number | null; responseBody: unknown; resourceId: string | null; errorCode: string | null }
  | { kind: 'in_progress'; id: string };

export type ExistingIdempotency = { id: string; requestHash: string; status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'; responseStatus: number | null; responseBody: unknown; resourceId: string | null; errorCode: string | null };

export function classifyExistingIdempotency(existing: ExistingIdempotency | null, hash: string): 'new' | 'in_progress' | 'replay' | 'conflict' {
  if (!existing) return 'new';
  if (existing.requestHash !== hash) return 'conflict';
  return existing.status === 'IN_PROGRESS' ? 'in_progress' : 'replay';
}

function stable(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(',')}}`;
}

export function requestHash(payload: unknown) { return createHash('sha256').update(stable(payload)).digest('hex'); }

export async function reserveIdempotency(userId: string, key: string, operation: string, payload: unknown): Promise<IdempotencyReservation> {
  const safeKey = idempotencyKeySchema.parse(key);
  const hash = requestHash(payload);
  const existing = await prisma.idempotencyRecord.findUnique({ where: { userId_key_operation: { userId, key: safeKey, operation } } });
  if (existing) {
    if (existing.requestHash !== hash) throw new Error('Idempotency key was already used with a different request.');
    if (existing.status === 'IN_PROGRESS') return { kind: 'in_progress', id: existing.id };
    return { kind: 'replay', id: existing.id, status: existing.status, responseStatus: existing.responseStatus, responseBody: existing.responseBody, resourceId: existing.resourceId, errorCode: existing.errorCode };
  }
  try {
    const record = await prisma.idempotencyRecord.create({ data: { userId, key: safeKey, operation, requestHash: hash } });
    return { kind: 'new', id: record.id };
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
    const raced = await prisma.idempotencyRecord.findUniqueOrThrow({ where: { userId_key_operation: { userId, key: safeKey, operation } } });
    if (raced.requestHash !== hash) throw new Error('Idempotency key was already used with a different request.');
    if (raced.status === 'IN_PROGRESS') return { kind: 'in_progress', id: raced.id };
    return { kind: 'replay', id: raced.id, status: raced.status, responseStatus: raced.responseStatus, responseBody: raced.responseBody, resourceId: raced.resourceId, errorCode: raced.errorCode };
  }
}

export async function completeIdempotency(id: string, responseStatus: number, responseBody: unknown, resourceId?: string | null) {
  return prisma.idempotencyRecord.update({ where: { id }, data: { status: 'COMPLETED', responseStatus, responseBody: responseBody as Prisma.InputJsonValue, resourceId: resourceId ?? null } });
}

export async function failIdempotency(id: string, errorCode: string) {
  return prisma.idempotencyRecord.update({ where: { id }, data: { status: 'FAILED', errorCode } });
}
