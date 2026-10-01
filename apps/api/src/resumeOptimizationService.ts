import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { optimizationRequestSchema, optimizationResultSchema, optimizationSuggestionStatusSchema, resumeDocumentSchema } from '@pba/shared';
import { prisma } from './prisma.js';
import { ownedResume, ResumeNotFoundError, getResume } from './resumeService.js';
import { createResumeOptimizationProvider, type ResumeOptimizationInput } from './aiResumeProvider.js';

export class OptimizationNotFoundError extends Error { constructor() { super('Optimization not found'); this.name = 'OptimizationNotFoundError'; } }
export class SuggestionNotFoundError extends Error { constructor() { super('Suggestion not found'); this.name = 'SuggestionNotFoundError'; } }

function factsFromResume(resume: Awaited<ReturnType<typeof ownedResume>>): ResumeOptimizationInput {
  const profile = resume.user.profile;
  if (!profile) throw new ResumeNotFoundError();
  return { jobDescription: '', summary: resume.versions[0] ? resumeDocumentSchema.parse(resume.versions[0].content).summary : profile.summary ?? '', facts: [
    ...profile.experiences.map(item => ({ id: `experience:${item.id}`, text: `${item.title} ${item.company} ${item.description ?? ''}` })),
    ...profile.educations.map(item => ({ id: `education:${item.id}`, text: `${item.degree} ${item.field ?? ''} ${item.institution}` })),
    ...profile.skills.map(item => ({ id: `skill:${item.id}`, text: item.name })),
    ...profile.projects.map(item => ({ id: `project:${item.id}`, text: `${item.name} ${item.description ?? ''}` })),
    ...profile.certifications.map(item => ({ id: `certification:${item.id}`, text: `${item.name} ${item.issuer ?? ''}` })),
    ...profile.achievements.map(item => ({ id: `achievement:${item.id}`, text: `${item.title} ${item.description ?? ''}` })),
  ] };
}

async function ownedOptimization(userId: string, resumeId: string, optimizationId: string) {
  const optimization = await prisma.resumeOptimization.findFirst({ where: { id: optimizationId, resumeId, resume: { userId } } });
  if (!optimization) throw new OptimizationNotFoundError();
  return optimization;
}
function serialize(optimization: { id: string; resumeId: string; jobDescription: string; provider: string; suggestions: Prisma.JsonValue; createdAt: Date; updatedAt: Date }) { return { ...optimization, result: optimizationResultSchema.parse(optimization.suggestions) }; }

export async function createOptimization(userId: string, resumeId: string, input: unknown) {
  const { jobDescription } = optimizationRequestSchema.parse(input); const resume = await ownedResume(userId, resumeId); const result = await createResumeOptimizationProvider().optimize({ ...factsFromResume(resume), jobDescription });
  const optimization = await prisma.resumeOptimization.create({ data: { resumeId, jobDescription, provider: result.provider, suggestions: result as Prisma.InputJsonValue } });
  return serialize(optimization);
}
export async function getOptimization(userId: string, resumeId: string, optimizationId: string) { return serialize(await ownedOptimization(userId, resumeId, optimizationId)); }
export async function regenerateOptimization(userId: string, resumeId: string, optimizationId: string) { const existing = await ownedOptimization(userId, resumeId, optimizationId); const resume = await ownedResume(userId, resumeId); const result = await createResumeOptimizationProvider().optimize({ ...factsFromResume(resume), jobDescription: existing.jobDescription }); const optimization = await prisma.resumeOptimization.update({ where: { id: existing.id }, data: { provider: result.provider, suggestions: result as Prisma.InputJsonValue } }); return serialize(optimization); }
export async function updateSuggestion(userId: string, resumeId: string, optimizationId: string, suggestionId: string, statusInput: unknown) { const { status } = z.object({ status: optimizationSuggestionStatusSchema }).parse(statusInput); const existing = await ownedOptimization(userId, resumeId, optimizationId); const result = optimizationResultSchema.parse(existing.suggestions); const suggestion = result.suggestions.find(item => item.id === suggestionId); if (!suggestion) throw new SuggestionNotFoundError(); suggestion.status = status; const optimization = await prisma.resumeOptimization.update({ where: { id: existing.id }, data: { suggestions: result as Prisma.InputJsonValue } }); return serialize(optimization); }
export async function applyOptimization(userId: string, resumeId: string, optimizationId: string) { const existing = await ownedOptimization(userId, resumeId, optimizationId); const result = optimizationResultSchema.parse(existing.suggestions); const accepted = result.suggestions.filter(item => item.status === 'accepted').map(item => item.id); const resume = await ownedResume(userId, resumeId); const latest = resume.versions[0]; if (!latest) throw new ResumeNotFoundError(); const document = resumeDocumentSchema.parse(latest.content); const content = { ...document, acceptedSuggestionIds: [...new Set([...document.acceptedSuggestionIds, ...accepted])] }; const version = (latest.version ?? 0) + 1; await prisma.resumeVersion.create({ data: { resumeId, version, content: content as Prisma.InputJsonValue } }); return getResume(userId, resumeId); }
