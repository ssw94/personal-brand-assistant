import type { AgentFailureCategory, Prisma } from '@prisma/client';
import { prisma } from './prisma.js';
import { redactedError } from './redaction.js';

export type AuthenticatedPrincipal = Readonly<{ userId: string }>;
export type CreateAgentRunInput = { principal: AuthenticatedPrincipal; operation: string; provider: string; model: string; promptIdentifier: string; promptVersion: number; schemaName: string; schemaVersion: number; correlationId?: string | undefined; idempotencyKey?: string | undefined };
export type UsageInput = { inputTokens?: number | undefined; outputTokens?: number | undefined; totalTokens?: number | undefined; estimatedCost?: number | null | undefined; costCurrency?: string | null | undefined };
export const AGENT_RUN_LEASE_MS = 5 * 60 * 1000;

export class AgentRunTransitionError extends Error { constructor() { super('Agent run transition is not allowed.'); this.name = 'AgentRunTransitionError'; } }
function ownerWhere(principal: AuthenticatedPrincipal, id: string) { return { id_userId: { id, userId: principal.userId } }; }
function usageData(usage?: UsageInput) { return { inputTokenCount: usage?.inputTokens ?? null, outputTokenCount: usage?.outputTokens ?? null, totalTokenCount: usage?.totalTokens ?? null, estimatedCost: usage?.estimatedCost ?? null, costCurrency: usage?.costCurrency ?? null }; }

async function transition(principal: AuthenticatedPrincipal, id: string, from: 'QUEUED' | 'RUNNING', data: Prisma.AgentRunUpdateManyMutationInput) {
  const result = await prisma.agentRun.updateMany({ where: { userId: principal.userId, id, status: from }, data });
  if (!result.count) throw new AgentRunTransitionError();
  return prisma.agentRun.findUniqueOrThrow({ where: ownerWhere(principal, id) });
}

export const agentRunService = {
  create(input: CreateAgentRunInput) { return prisma.agentRun.create({ data: { userId: input.principal.userId, operation: input.operation, provider: input.provider, model: input.model, promptIdentifier: input.promptIdentifier, promptVersion: input.promptVersion, schemaName: input.schemaName, schemaVersion: input.schemaVersion, correlationId: input.correlationId ?? null, idempotencyKey: input.idempotencyKey ?? null } }); },
  start(principal: AuthenticatedPrincipal, id: string) { const now = new Date(); return transition(principal, id, 'QUEUED', { status: 'RUNNING', startedAt: now, heartbeatAt: now, leaseExpiresAt: new Date(now.getTime() + AGENT_RUN_LEASE_MS), failureCategory: null, failureMessage: null }); },
  heartbeat(principal: AuthenticatedPrincipal, id: string) { const now = new Date(); return prisma.agentRun.updateMany({ where: { ...ownerWhere(principal, id), status: 'RUNNING' }, data: { heartbeatAt: now, leaseExpiresAt: new Date(now.getTime() + AGENT_RUN_LEASE_MS) } }); },
  complete(principal: AuthenticatedPrincipal, id: string, usage: UsageInput) { return transition(principal, id, 'RUNNING', { status: 'COMPLETED', completedAt: new Date(), leaseExpiresAt: null, ...usageData(usage), failureCategory: null, failureMessage: null }); },
  fail(principal: AuthenticatedPrincipal, id: string, category: AgentFailureCategory, message: string, usage?: UsageInput) { return transition(principal, id, 'RUNNING', { status: 'FAILED', completedAt: new Date(), leaseExpiresAt: null, failureCategory: category, failureMessage: redactedError(new Error(message)).message, ...usageData(usage) }); },
  cancel(principal: AuthenticatedPrincipal, id: string) { return transition(principal, id, 'RUNNING', { status: 'CANCELLED', cancelledAt: new Date(), completedAt: new Date(), leaseExpiresAt: null, failureCategory: 'CANCELLED', failureMessage: 'Model request cancelled.' }); },
  recoverStale(principal: AuthenticatedPrincipal, now = new Date()) { return prisma.agentRun.updateMany({ where: { userId: principal.userId, status: 'RUNNING', leaseExpiresAt: { lt: now } }, data: { status: 'FAILED', completedAt: now, leaseExpiresAt: null, failureCategory: 'TIMEOUT', failureMessage: 'Model execution lease expired.' } }); },
  recoverStaleAll(now = new Date()) { return prisma.agentRun.updateMany({ where: { status: 'RUNNING', leaseExpiresAt: { lt: now } }, data: { status: 'FAILED', completedAt: now, leaseExpiresAt: null, failureCategory: 'TIMEOUT', failureMessage: 'Model execution lease expired.' } }); },
  recordUsage(principal: AuthenticatedPrincipal, runId: string, provider: string, model: string, usage: UsageInput) { return prisma.modelUsage.create({ data: { provider, model, ...usageData(usage), run: { connect: ownerWhere(principal, runId) } } }); },
  async registerPrompt(identifier: string, version: number, schemaName: string, schemaVersion: number, templateDigest: string, description?: string) { const existing = await prisma.promptVersion.findUnique({ where: { identifier_version: { identifier, version } } }); if (existing && (existing.templateDigest !== templateDigest || existing.schemaName !== schemaName || existing.schemaVersion !== schemaVersion)) throw new Error('Prompt versions are immutable.'); if (existing) return existing; try { return await prisma.promptVersion.create({ data: { identifier, version, schemaName, schemaVersion, templateDigest, description: description ?? null } }); } catch (error) { return prisma.promptVersion.findUniqueOrThrow({ where: { identifier_version: { identifier, version } } }).then((record) => { if (record.templateDigest !== templateDigest || record.schemaName !== schemaName || record.schemaVersion !== schemaVersion) throw error; return record; }); } },
};
