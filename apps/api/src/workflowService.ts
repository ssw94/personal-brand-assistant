import { prisma } from './prisma.js';
import { generateWriterDraft } from './writerService.js';
import { critiqueDraftWithAgent } from './criticService.js';
import { reviseDraft } from './revisionService.js';
import type { ModelGateway } from './modelGateway.js';

export class WorkflowInputError extends Error { constructor(message: string) { super(message); this.name = 'WorkflowInputError'; } }
export class WorkflowNotFoundError extends Error { constructor() { super('Workflow run not found.'); this.name = 'WorkflowNotFoundError'; } }

export async function startContentWorkflow(userId: string, topicId: string, gateway?: ModelGateway) {
  const topic = await prisma.topicCandidate.findFirst({ where: { id: topicId, userId, status: 'SELECTED' }, select: { id: true } });
  if (!topic) throw new WorkflowInputError('A selected topic candidate is required.');
  const run = await prisma.$transaction(async tx => {
    const created = await tx.workflowRun.create({ data: { userId, topicId, status: 'RUNNING', currentStep: 'WRITER' } });
    await tx.workflowStep.createMany({ data: ['WRITER', 'CRITIC', 'REVISION'].map(name => ({ userId, runId: created.id, name })) });
    return created;
  });
  try {
    await markStep(run.id, userId, 'WRITER', 'RUNNING');
    const writer = await generateWriterDraft(userId, { topicCandidateId: topicId, title: 'LinkedIn draft' }, gateway);
    await markStep(run.id, userId, 'WRITER', 'COMPLETED', writer.runId);
    await prisma.workflowRun.update({ where: { id: run.id, userId }, data: { draftId: writer.draft.id, currentStep: 'CRITIC' } });
    await markStep(run.id, userId, 'CRITIC', 'RUNNING');
    const critic = await critiqueDraftWithAgent(userId, { draftId: writer.draft.id }, gateway);
    await markStep(run.id, userId, 'CRITIC', 'COMPLETED', critic.runId);
    await prisma.workflowRun.update({ where: { id: run.id, userId }, data: { currentStep: 'REVISION' } });
    await markStep(run.id, userId, 'REVISION', 'RUNNING');
    const revision = await reviseDraft(userId, { draftId: writer.draft.id, critiqueId: critic.critique.id, instructions: '' }, gateway);
    await markStep(run.id, userId, 'REVISION', 'COMPLETED', revision.runId);
    return prisma.workflowRun.update({ where: { id: run.id, userId }, data: { status: 'COMPLETED', currentStep: null, completedAt: new Date() }, include: { steps: { orderBy: { createdAt: 'asc' } } } });
  } catch (error) {
    await prisma.workflowRun.update({ where: { id: run.id, userId }, data: { status: 'FAILED', failureReason: error instanceof Error ? error.message : 'Workflow failed.', completedAt: new Date() } }).catch(() => undefined);
    throw error;
  }
}

async function markStep(runId: string, userId: string, name: string, status: 'RUNNING' | 'COMPLETED', agentRunId?: string) {
  await prisma.workflowStep.updateMany({ where: { runId, userId, name }, data: { status, ...(status === 'RUNNING' ? { startedAt: new Date() } : { completedAt: new Date(), agentRunId: agentRunId ?? null }) } });
}

export async function getWorkflow(userId: string, id: string) {
  const run = await prisma.workflowRun.findFirst({ where: { id, userId }, include: { steps: { orderBy: { createdAt: 'asc' } } } });
  if (!run) throw new WorkflowNotFoundError();
  return run;
}

export function workflowErrorStatus(error: unknown) { if (error instanceof WorkflowNotFoundError) return 404; if (error instanceof WorkflowInputError) return 409; return 500; }
