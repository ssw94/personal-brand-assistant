import { createHash } from 'node:crypto';
import { idSchema, idempotencyKeySchema } from '@pba/shared';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

export const IDEMPOTENCY_LEASE_MS = 5 * 60 * 1000;
const MAX_RESPONSE_BYTES = 256 * 1024;

export class IdempotencyInProgressError extends Error {
  constructor() { super('An equivalent request is already in progress.'); this.name = 'IdempotencyInProgressError'; }
}

export type IdempotencyReservation =
  | { kind: 'new'; id: string }
  | { kind: 'replay'; id: string; status: 'COMPLETED' | 'FAILED'; responseStatus: number | null; responseBody: unknown; resourceId: string | null; errorCode: string | null }
  | { kind: 'in_progress'; id: string };

export type ExistingIdempotency = { id: string; requestHash: string; status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'; responseStatus: number | null; responseBody: unknown; resourceId: string | null; errorCode: string | null; expiresAt?: Date | null };
export type IdempotencyResult = { status: number; body: unknown; resourceId?: string | null };

export function classifyExistingIdempotency(existing: ExistingIdempotency | null, hash: string, now = new Date()): 'new' | 'in_progress' | 'stale' | 'replay' | 'conflict' {
  if (!existing) return 'new';
  if (existing.requestHash !== hash) return 'conflict';
  if (existing.status === 'IN_PROGRESS') return existing.expiresAt && existing.expiresAt <= now ? 'stale' : 'in_progress';
  return 'replay';
}

function stable(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) throw new Error('Idempotency payload must be JSON serializable.');
    return serialized;
  }
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(',')}}`;
}

export function requestHash(payload: unknown) { return createHash('sha256').update(stable(payload)).digest('hex'); }

function validateOperation(operation: string) { return idSchema.parse(operation); }
function validateResponse(result: IdempotencyResult) {
  if (!Number.isInteger(result.status) || result.status < 100 || result.status > 599) throw new Error('Idempotency response status must be an HTTP status code.');
  const serialized = JSON.stringify(result.body);
  if (serialized === undefined || serialized.length > MAX_RESPONSE_BYTES) throw new Error('Idempotency response body is not valid or is too large.');
}

function replay(record: ExistingIdempotency): IdempotencyReservation {
  return { kind: 'replay', id: record.id, status: record.status as 'COMPLETED' | 'FAILED', responseStatus: record.responseStatus, responseBody: record.responseBody, resourceId: record.resourceId, errorCode: record.errorCode };
}

export async function reserveIdempotency(userId: string, key: string, operation: string, payload: unknown): Promise<IdempotencyReservation> {
  const safeUserId = idSchema.parse(userId);
  const safeKey = idempotencyKeySchema.parse(key);
  const safeOperation = validateOperation(operation);
  const hash = requestHash(payload);
  const now = new Date();
  const where = { userId_key_operation: { userId: safeUserId, key: safeKey, operation: safeOperation } };
  const existing = await prisma.idempotencyRecord.findUnique({ where });
  const classification = classifyExistingIdempotency(existing, hash, now);
  if (classification === 'conflict') throw new Error('Idempotency key was already used with a different request.');
  if (classification === 'replay') return replay(existing!);
  if (classification === 'in_progress') return { kind: 'in_progress', id: existing!.id };
  if (classification === 'stale') {
    const recovered = await prisma.idempotencyRecord.updateMany({ where: { id: existing!.id, status: 'IN_PROGRESS', expiresAt: { lte: now }, requestHash: hash }, data: { responseStatus: null, responseBody: Prisma.JsonNull, resourceId: null, errorCode: null, expiresAt: new Date(now.getTime() + IDEMPOTENCY_LEASE_MS), updatedAt: now } });
    if (recovered.count) return { kind: 'new', id: existing!.id };
    return reserveIdempotency(safeUserId, safeKey, safeOperation, payload);
  }
  try {
    const record = await prisma.idempotencyRecord.create({ data: { userId: safeUserId, key: safeKey, operation: safeOperation, requestHash: hash, expiresAt: new Date(now.getTime() + IDEMPOTENCY_LEASE_MS) } });
    return { kind: 'new', id: record.id };
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
    return reserveIdempotency(safeUserId, safeKey, safeOperation, payload);
  }
}

export async function completeIdempotency(id: string, result: IdempotencyResult) {
  validateResponse(result);
  return prisma.idempotencyRecord.update({ where: { id }, data: { status: 'COMPLETED', responseStatus: result.status, responseBody: result.body as Prisma.InputJsonValue, resourceId: result.resourceId ?? null, errorCode: null, expiresAt: null } });
}

export async function failIdempotency(id: string, errorCode: string, result: IdempotencyResult = { status: 500, body: { error: 'Operation failed.' } }) {
  validateOperation(errorCode);
  validateResponse(result);
  return prisma.idempotencyRecord.update({ where: { id }, data: { status: 'FAILED', responseStatus: result.status, responseBody: result.body as Prisma.InputJsonValue, errorCode, expiresAt: null } });
}

export async function withIdempotency(userId: string, key: string, operation: string, payload: unknown, execute: () => Promise<IdempotencyResult>): Promise<IdempotencyResult & { replayed: boolean }> {
  const reservation = await reserveIdempotency(userId, key, operation, payload);
  if (reservation.kind === 'replay') return { status: reservation.responseStatus ?? 500, body: reservation.responseBody, resourceId: reservation.resourceId, replayed: true };
  if (reservation.kind === 'in_progress') throw new IdempotencyInProgressError();
  try {
    const result = await execute();
    await completeIdempotency(reservation.id, result);
    return { ...result, replayed: false };
  } catch (error) {
    try { await failIdempotency(reservation.id, error instanceof Error ? error.name : 'OperationFailed'); } catch { /* preserve the operation failure; reconciliation can inspect the lease */ }
    throw error;
  }
}
