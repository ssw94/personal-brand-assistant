import { scheduleRequestSchema, type ScheduleRequest } from '@pba/shared';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';
import { publishApprovedDraft } from './linkedinService.js';
import { assertFeatureEntitled } from './usageService.js';

export class SchedulingInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchedulingInputError';
  }
}
export class SchedulingNotFoundError extends Error {
  constructor() {
    super('Scheduled publishing job not found.');
    this.name = 'SchedulingNotFoundError';
  }
}

export async function scheduleApprovedDraft(userId: string, input: unknown) {
  await assertFeatureEntitled(userId, 'scheduling');
  const data: ScheduleRequest = scheduleRequestSchema.parse(input);
  const when = new Date(data.scheduledAt);
  if (when <= new Date()) throw new SchedulingInputError('Schedule time must be in the future.');
  const draft = await prisma.contentDraft.findFirst({
    where: { id: data.draftId, userId, status: 'APPROVED' },
    include: { revisions: { orderBy: { version: 'desc' }, take: 1 } },
  });
  if (!draft || !draft.revisions[0] || draft.revisions[0].id !== data.revisionId)
    throw new SchedulingInputError('Only the latest approved revision can be scheduled.');
  const account = await prisma.linkedInAccount.findFirst({
    where: { id: data.accountId, userId, disconnectedAt: null },
    select: { id: true },
  });
  if (!account) throw new SchedulingInputError('LinkedIn account is not connected.');
  let job;
  try {
    job = await prisma.$transaction(async (tx) => {
      const existing = await tx.publishingJob.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey: data.idempotencyKey } },
      });
      if (existing) {
        if (
          existing.draftId !== data.draftId ||
          existing.revisionId !== data.revisionId ||
          existing.accountId !== data.accountId ||
          existing.scheduledAt.getTime() !== when.getTime() ||
          existing.timezone !== data.timezone
        )
          throw new SchedulingInputError(
            'The idempotency key is already used for a different schedule.',
          );
        return existing;
      }
      const created = await tx.publishingJob.create({
        data: {
          userId,
          draftId: data.draftId,
          revisionId: data.revisionId,
          accountId: data.accountId,
          scheduledAt: when,
          timezone: data.timezone,
          idempotencyKey: data.idempotencyKey,
        },
      });
      await tx.contentDraft.update({
        where: { id: data.draftId, userId },
        data: { status: 'SCHEDULED', scheduledAt: when },
      });
      return created;
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002')
      throw error;
    const existing = await prisma.publishingJob.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey: data.idempotencyKey } },
    });
    if (!existing) throw error;
    if (
      existing.draftId !== data.draftId ||
      existing.revisionId !== data.revisionId ||
      existing.accountId !== data.accountId ||
      existing.scheduledAt.getTime() !== when.getTime() ||
      existing.timezone !== data.timezone
    )
      throw new SchedulingInputError(
        'The idempotency key is already used for a different schedule.',
      );
    job = existing;
  }
  return {
    id: job.id,
    status: job.status,
    scheduledAt: job.scheduledAt.toISOString(),
    timezone: job.timezone,
  };
}

export async function cancelScheduledJob(userId: string, id: string) {
  const result = await prisma.publishingJob.updateMany({
    where: { id, userId, status: 'QUEUED' },
    data: { status: 'CANCELLED' },
  });
  if (!result.count) throw new SchedulingNotFoundError();
  return { id, status: 'CANCELLED' as const };
}
export async function listScheduledJobs(userId: string) {
  const jobs = await prisma.publishingJob.findMany({
    where: { userId },
    orderBy: { scheduledAt: 'asc' },
    take: 100,
  });
  return jobs.map((job) => ({
    id: job.id,
    draftId: job.draftId,
    revisionId: job.revisionId,
    accountId: job.accountId,
    status: job.status,
    scheduledAt: job.scheduledAt.toISOString(),
    timezone: job.timezone,
    attemptCount: job.attemptCount,
    lastError: job.lastError,
  }));
}

export async function runDuePublishingJobs(limit = 10, now = new Date()) {
  const completed: string[] = [];
  for (let count = 0; count < limit; count += 1) {
    const job = await prisma.$transaction(async (tx) => {
      const candidate = await tx.publishingJob.findFirst({
        where: {
          OR: [
            { status: 'QUEUED', scheduledAt: { lte: now } },
            { status: 'RUNNING', leaseUntil: { lt: now } },
          ],
        },
        orderBy: { scheduledAt: 'asc' },
      });
      if (!candidate) return null;
      const claimed = await tx.publishingJob.updateMany({
        where: { id: candidate.id, status: candidate.status },
        data: {
          status: 'RUNNING',
          leaseUntil: new Date(now.getTime() + 5 * 60 * 1000),
          attemptCount: { increment: 1 },
        },
      });
      if (!claimed.count) return null;
      await tx.publishingJobAttempt.create({
        data: { userId: candidate.userId, jobId: candidate.id, status: 'RUNNING' },
      });
      return candidate;
    });
    if (!job) break;
    try {
      await publishApprovedDraft(job.userId, job.draftId, job.accountId);
      await prisma.publishingJob.update({
        where: { id: job.id },
        data: { status: 'COMPLETED', leaseUntil: null },
      });
      completed.push(job.id);
    } catch (error) {
      await prisma.publishingJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          leaseUntil: null,
          lastError: error instanceof Error ? error.message : 'Publishing failed.',
        },
      });
    }
  }
  return completed;
}

export function schedulingErrorStatus(error: unknown) {
  if (error instanceof SchedulingNotFoundError) return 404;
  if (error instanceof SchedulingInputError) return 409;
  return 500;
}
