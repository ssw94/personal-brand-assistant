import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PromptRegistry } from './promptRegistry.js';
import { ModelGateway } from './modelGateway.js';
import { FakeModelTransport } from './modelTransport.js';
import { prisma } from './prisma.js';
import { startContentWorkflow } from './workflowService.js';
import { decideDraftApproval, submitDraftForReview } from './approvalService.js';

const suite = process.env.RUN_PHASE1_DB_TESTS === '1' ? describe : describe.skip;
suite('production content workflow boundary', () => {
  let userId = '';
  let topicId = '';
  let draftId = '';
  let revisionId = '';
  let gateway: ModelGateway;

  beforeAll(async () => {
    await prisma.$connect();
    const user = await prisma.user.create({
      data: { email: `workflow-${Date.now()}@example.test`, plan: 'FREE' },
    });
    userId = user.id;
    const fact = await prisma.memoryFact.create({
      data: {
        userId,
        factType: 'EXPERIENCE',
        category: 'platform engineering',
        normalizedValue: 'Built reliable platform services',
        confidence: 0.95,
        reviewState: 'VERIFIED',
        verifiedAt: new Date(),
      },
    });
    const topicRun = await prisma.agentRun.create({
      data: {
        userId,
        operation: 'topic.generate',
        provider: 'fake',
        model: 'fake',
        promptIdentifier: 'topic.generate.v1',
        promptVersion: 1,
        schemaName: 'TopicGenerationResult',
        schemaVersion: 1,
      },
    });
    const topic = await prisma.topicCandidate.create({
      data: {
        userId,
        runId: topicRun.id,
        title: 'Reliable platform services',
        angle: 'A practical lesson from platform engineering',
        rationale: 'Grounded in verified experience.',
        noveltyKey: `workflow-${Date.now()}`,
        memoryFactIds: [fact.id],
        status: 'SELECTED',
      },
    });
    topicId = topic.id;
    const registry = new PromptRegistry();
    registry.register({
      identifier: 'writer.generate.v1',
      version: 1,
      schemaName: 'WriterResult',
      schemaVersion: 1,
      systemInstruction: 'writer',
    });
    registry.register({
      identifier: 'critic.evaluate.v1',
      version: 1,
      schemaName: 'CriticResult',
      schemaVersion: 1,
      systemInstruction: 'critic',
    });
    registry.register({
      identifier: 'revision.apply.v1',
      version: 1,
      schemaName: 'RevisionResult',
      schemaVersion: 1,
      systemInstruction: 'revision',
    });
    const transport = new FakeModelTransport();
    transport.enqueue({
      outputText: JSON.stringify({
        title: 'Reliable platform services',
        body: 'A practical lesson from building reliable platform services.',
        sourceFactIds: [fact.id],
        sourceResearchIds: [],
      }),
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    });
    transport.enqueue({
      outputText: JSON.stringify({
        summary: 'Clear and grounded.',
        strengths: ['Grounded'],
        improvements: ['Add a concrete takeaway'],
        unsupportedClaims: [],
        score: 85,
      }),
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    });
    transport.enqueue({
      outputText: JSON.stringify({
        body: 'A practical lesson from building reliable platform services: make reliability visible and measurable.',
        preservedFactIds: [fact.id],
      }),
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    });
    gateway = new ModelGateway({
      config: {
        provider: 'openai',
        apiKey: 'test-only',
        baseUrl: 'https://example.test',
        defaultModel: 'fake',
        policyModels: {
          generic: 'fake',
          research: 'fake',
          topic: 'fake',
          writer: 'fake',
          critic: 'fake',
          revision: 'fake',
        },
        timeoutMs: 1000,
        maxAttempts: 1,
        backoffMs: 1,
        maxInputTokens: 10000,
        maxOutputTokens: 1000,
        maxEstimatedCost: null,
        pricing: {},
      },
      transport,
      promptRegistry: registry,
    });
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('executes, persists, and gates the full writer-to-approval chain', async () => {
    const workflow = await startContentWorkflow(userId, topicId, gateway);
    expect(workflow.status).toBe('COMPLETED');
    expect(workflow.steps.map((step) => step.status)).toEqual([
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
    ]);
    draftId = workflow.draftId!;
    const draft = await prisma.contentDraft.findFirstOrThrow({
      where: { id: draftId, userId },
      include: { revisions: { orderBy: { version: 'desc' }, take: 1 }, critiques: true },
    });
    expect(draft.status).toBe('REVIEW');
    expect(draft.critiques).toHaveLength(1);
    revisionId = draft.revisions[0]!.id;
    await submitDraftForReview(userId, draftId);
    const approval = await decideDraftApproval(userId, draftId, {
      revisionId,
      decision: 'APPROVED',
    });
    expect(approval.decision).toBe('APPROVED');
    const approved = await prisma.contentDraft.findFirstOrThrow({ where: { id: draftId, userId } });
    expect(approved.status).toBe('APPROVED');
  });
});
