import { insightDecisionSchema } from '@pba/shared';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

export class InsightNotFoundError extends Error { constructor() { super('Insight not found.'); this.name = 'InsightNotFoundError'; } }
export async function generateAnalyticsInsights(userId: string) {
  const metrics = await prisma.postMetricSnapshot.findMany({ where: { userId }, orderBy: { observedAt: 'desc' }, take: 200 });
  if (metrics.length < 2) return [];
  const byMetric = new Map<string, number[]>(); for (const metric of metrics) byMetric.set(metric.metricName, [...(byMetric.get(metric.metricName) ?? []), metric.value]);
  const created = [];
  for (const [metricName, values] of byMetric) { const latest = values[0]!; const baseline = values.slice(1).reduce((sum, value) => sum + value, 0) / Math.max(values.length - 1, 1); if (baseline === 0 || Math.abs(latest - baseline) / baseline < 0.2) continue; const direction = latest > baseline ? 'increased' : 'decreased'; const summary = `${metricName} ${direction} versus the observed baseline`; const evidence = { metricName, latest, baseline, sampleSize: values.length }; const insight = await prisma.analyticsInsight.upsert({ where: { userId_kind_summary: { userId, kind: 'metric_change', summary } }, create: { userId, kind: 'metric_change', summary, evidence: evidence as Prisma.InputJsonValue, confidence: Math.min(values.length / 10, 1) }, update: { evidence: evidence as Prisma.InputJsonValue, confidence: Math.min(values.length / 10, 1) } }); const feedback = await prisma.topicFeedbackCandidate.upsert({ where: { id: `feedback-${insight.id}` }, create: { id: `feedback-${insight.id}`, userId, insightId: insight.id, guidance: `Consider whether future topics should explore patterns associated with ${metricName}.` }, update: {} }); created.push({ id: insight.id, summary: insight.summary, confidence: insight.confidence, evidence: insight.evidence, feedbackId: feedback.id }); }
  return created;
}
export async function listInsights(userId: string) { return prisma.analyticsInsight.findMany({ where: { userId }, include: { feedback: true }, orderBy: { createdAt: 'desc' }, take: 100 }); }
export async function decideInsight(userId: string, id: string, input: unknown) { const decision = insightDecisionSchema.parse(input); const result = await prisma.analyticsInsight.updateMany({ where: { id, userId, status: 'CANDIDATE' }, data: { status: decision.decision } }); if (!result.count) throw new InsightNotFoundError(); await prisma.topicFeedbackCandidate.updateMany({ where: { insightId: id, userId }, data: { status: decision.decision, acceptedAt: decision.decision === 'ACCEPTED' ? new Date() : null } }); return { id, status: decision.decision }; }
export function intelligenceErrorStatus(error: unknown) { return error instanceof InsightNotFoundError ? 404 : 500; }
