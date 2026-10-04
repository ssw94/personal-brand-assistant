import type { AgentFailureCategory } from '@prisma/client';
import { prisma } from './prisma.js';

export type CreateAgentRunInput = { userId: string; operation: string; provider: string; model: string; promptIdentifier: string; promptVersion: number; correlationId?: string | undefined; idempotencyKey?: string | undefined };
export type UsageInput = { inputTokens?: number | undefined; outputTokens?: number | undefined; totalTokens?: number | undefined; estimatedCost?: number | null | undefined; costCurrency?: string | null | undefined };

export const agentRunService = {
  create(input: CreateAgentRunInput) { return prisma.agentRun.create({ data: { ...input, correlationId: input.correlationId ?? null, idempotencyKey: input.idempotencyKey ?? null } }); },
  start(id: string) { return prisma.agentRun.update({ where: { id }, data: { status: 'RUNNING', startedAt: new Date(), failureCategory: null, failureMessage: null } }); },
  complete(id: string, usage: UsageInput) { return prisma.agentRun.update({ where: { id }, data: { status: 'COMPLETED', completedAt: new Date(), inputTokenCount: usage.inputTokens ?? null, outputTokenCount: usage.outputTokens ?? null, totalTokenCount: usage.totalTokens ?? null, estimatedCost: usage.estimatedCost ?? null, costCurrency: usage.costCurrency ?? null, failureCategory: null, failureMessage: null } }); },
  fail(id: string, category: AgentFailureCategory, message: string, usage?: UsageInput) { return prisma.agentRun.update({ where: { id }, data: { status: 'FAILED', completedAt: new Date(), failureCategory: category, failureMessage: message, inputTokenCount: usage?.inputTokens ?? null, outputTokenCount: usage?.outputTokens ?? null, totalTokenCount: usage?.totalTokens ?? null, estimatedCost: usage?.estimatedCost ?? null, costCurrency: usage?.costCurrency ?? null } }); },
  cancel(id: string) { return prisma.agentRun.update({ where: { id }, data: { status: 'CANCELLED', cancelledAt: new Date(), completedAt: new Date(), failureCategory: 'CANCELLED', failureMessage: 'Model request cancelled.' } }); },
  recordUsage(runId: string, provider: string, model: string, usage: UsageInput) { return prisma.modelUsage.create({ data: { runId, provider, model, inputTokens: usage.inputTokens ?? null, outputTokens: usage.outputTokens ?? null, totalTokens: usage.totalTokens ?? null, estimatedCost: usage.estimatedCost ?? null, costCurrency: usage.costCurrency ?? null } }); },
  async registerPrompt(identifier: string, version: number, schemaName: string, templateDigest: string, description?: string) { const existing = await prisma.promptVersion.findUnique({ where: { identifier_version: { identifier, version } } }); if (existing && existing.templateDigest !== templateDigest) throw new Error('Prompt versions are immutable.'); return existing ?? prisma.promptVersion.create({ data: { identifier, version, schemaName, templateDigest, description: description ?? null } }); },
};
