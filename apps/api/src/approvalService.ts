import { Prisma } from '@prisma/client';
import { approvalAuditSchema, type ApprovalDecision } from '@pba/shared';
import { prisma } from './prisma.js';

export class ApprovalInputError extends Error { constructor(message: string) { super(message); this.name = 'ApprovalInputError'; } }
export class ApprovalNotFoundError extends Error { constructor() { super('Approval resource not found.'); this.name = 'ApprovalNotFoundError'; } }

export async function submitDraftForReview(userId: string, draftId: string) {
  const result = await prisma.contentDraft.updateMany({ where: { id: draftId, userId, status: { in: ['DRAFT', 'REVIEW'] } }, data: { status: 'REVIEW', reviewedAt: new Date() } });
  if (!result.count) throw new ApprovalNotFoundError();
  return { draftId, status: 'REVIEW' as const };
}

export async function decideDraftApproval(userId: string, draftId: string, input: unknown) {
  const data = approvalAuditSchema.parse({ ...(input as object), ownerUserId: userId, actorUserId: userId, draftId, revisionId: (input as { revisionId?: string }).revisionId, decision: (input as { decision?: ApprovalDecision }).decision });
  const result = await prisma.$transaction(async tx => {
    const draft = await tx.contentDraft.findFirst({ where: { id: draftId, userId, status: 'REVIEW' }, select: { id: true, status: true } });
    if (!draft) throw new ApprovalNotFoundError();
    const latest = await tx.contentRevision.findFirst({ where: { draftId, userId }, orderBy: { version: 'desc' }, select: { id: true } });
    if (!latest || latest.id !== data.revisionId) throw new ApprovalInputError('Only the latest revision can be approved.');
    const nextStatus = data.decision === 'APPROVED' ? 'APPROVED' : 'DRAFT';
    await tx.contentDraft.update({ where: { id: draftId, userId }, data: { status: nextStatus, approvedAt: data.decision === 'APPROVED' ? new Date() : null } });
    const approval = await tx.contentApproval.create({ data: { ownerUserId: userId, actorUserId: userId, draftId, revisionId: latest.id, decision: data.decision, reason: data.reason ?? null } });
    await tx.auditEvent.create({ data: { ownerUserId: userId, actorUserId: userId, resourceType: 'ContentDraft', resourceId: draftId, action: `approval.${data.decision.toLowerCase()}`, result: 'recorded', reason: data.reason ?? null, metadata: { approvalId: approval.id, revisionId: latest.id } as Prisma.InputJsonValue } });
    return approval;
  });
  return { id: result.id, draftId: result.draftId, revisionId: result.revisionId, decision: result.decision, reason: result.reason, createdAt: result.createdAt.toISOString() };
}

export function approvalErrorStatus(error: unknown) { if (error instanceof ApprovalNotFoundError) return 404; if (error instanceof ApprovalInputError || error instanceof Prisma.PrismaClientKnownRequestError) return 409; return 500; }
