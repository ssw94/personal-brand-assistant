import { approvalAuditSchema, auditEventSchema, type ApprovalAudit } from '@pba/shared';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

export async function createAuditEvent(input: unknown) {
  const data = auditEventSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({ where: { id: data.actorUserId }, select: { id: true } });
    if (!actor || actor.id !== data.ownerUserId) throw new Error('Audit actor is not authorized for this owner.');
    if (data.resourceType === 'ContentDraft') {
      const resource = await tx.contentDraft.findFirst({ where: { id: data.resourceId, userId: data.ownerUserId }, select: { id: true } });
      if (!resource) throw new Error('Audit resource is not owned by the actor.');
    } else if (data.resourceType === 'ContentRevision') {
      const resource = await tx.contentRevision.findFirst({ where: { id: data.resourceId, draft: { userId: data.ownerUserId } }, select: { id: true } });
      if (!resource) throw new Error('Audit resource is not owned by the actor.');
    } else if (data.resourceType === 'ContentIdea') {
      const resource = await tx.contentIdea.findFirst({ where: { id: data.resourceId, userId: data.ownerUserId }, select: { id: true } });
      if (!resource) throw new Error('Audit resource is not owned by the actor.');
    } else throw new Error('Audit resource type is not registered for ownership verification.');
    return tx.auditEvent.create({ data: { ...data, metadata: data.metadata ? data.metadata as Prisma.InputJsonValue : Prisma.JsonNull, reason: data.reason ?? null, correlationId: data.correlationId ?? null } });
  });
}

/** Records the approval evidence foundation without changing content state. */
export async function recordApprovalAudit(input: unknown) {
  const data: ApprovalAudit = approvalAuditSchema.parse(input);
  if (data.ownerUserId !== data.actorUserId) throw new Error('Approval actor is not authorized for this owner.');
  return prisma.$transaction(async (tx) => {
    const draft = await tx.contentDraft.findFirst({ where: { id: data.draftId, userId: data.ownerUserId }, select: { id: true } });
    if (!draft) throw new Error('Content draft not found.');
    const revision = await tx.contentRevision.findFirst({ where: { id: data.revisionId, draftId: data.draftId, draft: { userId: data.ownerUserId } }, select: { id: true } });
    if (!revision) throw new Error('Content revision not found.');
    const actor = await tx.user.findUnique({ where: { id: data.actorUserId }, select: { id: true } });
    if (!actor) throw new Error('Approval actor not found.');
    const approval = await tx.contentApproval.create({ data: { ownerUserId: data.ownerUserId, actorUserId: data.actorUserId, draftId: data.draftId, revisionId: data.revisionId, decision: data.decision, reason: data.reason ?? null } });
    await tx.auditEvent.create({ data: { ownerUserId: data.ownerUserId, actorUserId: data.actorUserId, resourceType: 'ContentDraft', resourceId: data.draftId, action: `approval.${data.decision.toLowerCase()}`, result: 'recorded', reason: data.reason ?? null, correlationId: data.correlationId ?? null, metadata: { approvalId: approval.id, revisionId: data.revisionId } } });
    return approval;
  });
}
