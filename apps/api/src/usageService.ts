import { planCatalog, usageSummarySchema, usageReservationSchema } from '@pba/shared';
import { Prisma, type UsageReservation } from '@prisma/client';
import { prisma } from './prisma.js';

export class UsageLimitExceededError extends Error { constructor() { super('The monthly posting limit has been reached.'); this.name = 'UsageLimitExceededError'; } }
export class FeatureNotEntitledError extends Error { constructor(feature: string) { super(`The current plan does not include ${feature}.`); this.name = 'FeatureNotEntitledError'; } }
export class UsageReservationNotFoundError extends Error { constructor() { super('Usage reservation not found.'); this.name = 'UsageReservationNotFoundError'; } }

function planFor(plan: string) { return planCatalog.find(candidate => candidate.id === plan) ?? planCatalog[0]; }
export async function assertFeatureEntitled(userId: string, feature: 'publishing' | 'scheduling') {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  const plan = planFor(user?.plan ?? 'FREE');
  const allowed = feature === 'publishing' ? plan.publishing !== 'Not included' : plan.scheduling !== 'Not included';
  if (!allowed) throw new FeatureNotEntitledError(feature);
}
function monthBounds(now = new Date()) { const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)); return { start, end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)) }; }
async function getOrCreatePeriod(tx: Prisma.TransactionClient, userId: string, plan: string, now = new Date()) {
  const { start, end } = monthBounds(now);
  return tx.usagePeriod.upsert({ where: { userId_periodStart_periodEnd: { userId, periodStart: start, periodEnd: end } }, create: { userId, periodStart: start, periodEnd: end, postLimit: planFor(plan).monthlyPostLimit }, update: { postLimit: planFor(plan).monthlyPostLimit } });
}
function serialiseReservation(reservation: UsageReservation) { return usageReservationSchema.parse({ id: reservation.id, operation: reservation.operation, quantity: reservation.quantity, status: reservation.status, createdAt: reservation.createdAt.toISOString() }); }

export async function getUsageSummary(userId: string, now = new Date()) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  const plan = planFor(user?.plan ?? 'FREE');
  const period = await prisma.$transaction(tx => getOrCreatePeriod(tx, userId, plan.id, now));
  return usageSummarySchema.parse({ plan: plan.id, periodStart: period.periodStart.toISOString(), periodEnd: period.periodEnd.toISOString(), limit: period.postLimit, reserved: period.reservedPosts, consumed: period.consumedPosts, remaining: period.postLimit === null ? null : Math.max(period.postLimit - period.reservedPosts - period.consumedPosts, 0) });
}

export async function reservePosts(userId: string, operation: string, idempotencyKey: string, quantity = 1) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw new UsageLimitExceededError();
  try {
    const reservation = await prisma.$transaction(async tx => {
      const existing = await tx.usageReservation.findUnique({ where: { userId_operation_idempotencyKey: { userId, operation, idempotencyKey } } });
      if (existing) return existing;
      const user = await tx.user.findUnique({ where: { id: userId }, select: { plan: true } });
      const period = await getOrCreatePeriod(tx, userId, user?.plan ?? 'FREE');
      const available = period.postLimit === null || period.reservedPosts + period.consumedPosts + quantity <= period.postLimit;
      if (!available) throw new UsageLimitExceededError();
      await tx.usagePeriod.update({ where: { id: period.id }, data: { reservedPosts: { increment: quantity } } });
      return tx.usageReservation.create({ data: { userId, periodId: period.id, operation, idempotencyKey, quantity } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return serialiseReservation(reservation);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') return reservePosts(userId, operation, idempotencyKey, quantity);
    throw error;
  }
}

export async function consumePosts(userId: string, reservationId: string) {
  const result = await prisma.$transaction(async tx => {
    const reservation = await tx.usageReservation.findFirst({ where: { id: reservationId, userId } });
    if (!reservation) throw new UsageReservationNotFoundError();
    if (reservation.status === 'CONSUMED') return reservation;
    if (reservation.status !== 'RESERVED') throw new UsageReservationNotFoundError();
    await tx.usagePeriod.update({ where: { id: reservation.periodId }, data: { reservedPosts: { decrement: reservation.quantity }, consumedPosts: { increment: reservation.quantity } } });
    return tx.usageReservation.update({ where: { id: reservation.id }, data: { status: 'CONSUMED', consumedAt: new Date() } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  return serialiseReservation(result);
}

export async function releasePosts(userId: string, reservationId: string) {
  const result = await prisma.$transaction(async tx => {
    const reservation = await tx.usageReservation.findFirst({ where: { id: reservationId, userId } });
    if (!reservation) throw new UsageReservationNotFoundError();
    if (reservation.status === 'RELEASED') return reservation;
    if (reservation.status !== 'RESERVED') throw new UsageReservationNotFoundError();
    await tx.usagePeriod.update({ where: { id: reservation.periodId }, data: { reservedPosts: { decrement: reservation.quantity } } });
    return tx.usageReservation.update({ where: { id: reservation.id }, data: { status: 'RELEASED', releasedAt: new Date() } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  return serialiseReservation(result);
}

export function usageErrorStatus(error: unknown) { if (error instanceof UsageReservationNotFoundError) return 404; if (error instanceof UsageLimitExceededError) return 429; if (error instanceof FeatureNotEntitledError) return 403; return 500; }
