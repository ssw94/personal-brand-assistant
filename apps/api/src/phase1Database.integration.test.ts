import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { prisma } from './prisma.js';

const enabled = process.env.RUN_PHASE1_DB_TESTS === '1';
const suite = enabled ? describe : describe.skip;

suite('Phase 1 database constraints', () => {
  let userId = '';
  let draftId = '';
  let revisionId = '';
  let approvalId = '';
  let auditId = '';
  let otherUserId = '';
  let runId = '';

  beforeAll(async () => {
    await prisma.$connect();
    const user = await prisma.user.create({ data: { email: `phase1-${Date.now()}@example.test` } });
    userId = user.id;
    const otherUser = await prisma.user.create({ data: { email: `phase1-other-${Date.now()}@example.test` } });
    otherUserId = otherUser.id;
    const draft = await prisma.contentDraft.create({ data: { userId, title: 'Phase 1 test', topic: 'Migration safety', body: 'Test body' } });
    draftId = draft.id;
    const revision = await prisma.contentRevision.create({ data: { draftId, userId, version: 1, body: draft.body, changeType: 'test' } });
    revisionId = revision.id;
    const approval = await prisma.contentApproval.create({ data: { ownerUserId: userId, actorUserId: userId, draftId, revisionId, decision: 'APPROVED' } });
    approvalId = approval.id;
    const audit = await prisma.auditEvent.create({ data: { ownerUserId: userId, actorUserId: userId, resourceType: 'ContentDraft', resourceId: draftId, action: 'test', result: 'success' } });
    auditId = audit.id;
    const run = await prisma.agentRun.create({ data: { userId, operation: 'test', provider: 'fake', model: 'fake', promptIdentifier: 'test', promptVersion: 1, schemaName: 'TestOutput', schemaVersion: 1 } });
    runId = run.id;
  });

  afterAll(async () => {
    if (auditId) await prisma.auditEvent.deleteMany({ where: { id: auditId } });
    if (approvalId) await prisma.contentApproval.deleteMany({ where: { id: approvalId } });
    if (draftId) await prisma.contentDraft.deleteMany({ where: { id: draftId } });
    if (userId) await prisma.user.delete({ where: { id: userId } });
    if (otherUserId) await prisma.user.delete({ where: { id: otherUserId } });
    await prisma.$disconnect();
  });

  it('preserves the draft and approval relationships', async () => {
    const found = await prisma.contentDraft.findUnique({ where: { id: draftId }, include: { revisions: true, approvals: true } });
    expect(found?.status).toBe('DRAFT');
    expect(found?.revisions.some((revision) => revision.id === revisionId)).toBe(true);
    expect(found?.approvals.some((approval) => approval.id === approvalId)).toBe(true);
  });

  it('prevents deleting a revision that has approval evidence', async () => {
    await expect(prisma.contentRevision.delete({ where: { id: revisionId } })).rejects.toMatchObject({ code: 'P2003' });
  });

  it('prevents deleting a draft that has approval evidence', async () => {
    await expect(prisma.contentDraft.delete({ where: { id: draftId } })).rejects.toMatchObject({ code: 'P2003' });
  });

  it('prevents deleting an actor while audit evidence references it', async () => {
    await expect(prisma.user.delete({ where: { id: userId } })).rejects.toMatchObject({ code: 'P2003' });
  });

  it('prevents cross-user agent artifacts from referencing drafts or revisions', async () => {
    const otherDraft = await prisma.contentDraft.create({ data: { userId: otherUserId, title: 'Other', topic: 'Other', body: 'Other' } });
    const otherRevision = await prisma.contentRevision.create({ data: { draftId: otherDraft.id, userId: otherUserId, version: 1, body: otherDraft.body, changeType: 'test' } });
    await expect(prisma.agentArtifact.create({ data: { userId, runId, artifactType: 'test', draftId: otherDraft.id } })).rejects.toMatchObject({ code: 'P2003' });
    await expect(prisma.agentArtifact.create({ data: { userId, runId, artifactType: 'test', revisionId: otherRevision.id } })).rejects.toMatchObject({ code: 'P2003' });
    await prisma.contentDraft.delete({ where: { id: otherDraft.id } });
  });
});
