import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { assistantAnswerSchema, assistantAskSchema, assistantConversationSchema, assistantMessageSchema, type AssistantConversation, type AssistantMessage } from '@pba/shared';
import { z } from 'zod';
import { prisma } from './prisma.js';
import { createCareerAssistantProvider, type CareerAssistantContext } from './aiCareerAssistantProvider.js';

export class AssistantUserNotFoundError extends Error { constructor() { super('User not found'); this.name = 'AssistantUserNotFoundError'; } }
export class AssistantConversationNotFoundError extends Error { constructor() { super('Conversation not found'); this.name = 'AssistantConversationNotFoundError'; } }

const profileInclude = { experiences: true, educations: true, skills: true, projects: true, certifications: true, achievements: true } as const;
const contextInclude = {
  profile: { include: profileInclude },
  jobs: { orderBy: { updatedAt: 'desc' as const } },
  resumes: { include: { versions: { orderBy: { version: 'desc' as const }, take: 1 } } },
  applications: { orderBy: { updatedAt: 'desc' as const }, include: { job: true, resumeVersion: { include: { resume: true } }, interviews: { orderBy: { updatedAt: 'desc' as const }, take: 1 } } },
} as const;

function profileText(profile: NonNullable<Awaited<ReturnType<typeof loadContext>>['profile']>) { return { targetRoles: profile.targetRoles, skills: profile.skills.map(skill => skill.name), headline: profile.headline ?? '', summary: profile.summary ?? '' }; }
async function loadContext(userId: string) { const user = await prisma.user.findUnique({ where: { id: userId }, include: contextInclude }); if (!user) throw new AssistantUserNotFoundError(); return user; }
function buildContext(user: Awaited<ReturnType<typeof loadContext>>): CareerAssistantContext {
  const profile = user.profile ? profileText(user.profile) : { targetRoles: [], skills: [], headline: '', summary: '' };
  return {
    profile,
    jobs: user.jobs.map(job => ({ id: job.id, title: job.title, company: job.company, description: job.description ?? '', skills: job.skills })),
    applications: user.applications.map(application => ({ id: application.id, title: application.job.title, company: application.job.company, status: application.status, followUpDate: application.followUpDate?.toISOString() ?? null, interviewDate: application.interviewDate?.toISOString() ?? null, resumeTitle: application.resumeVersion?.resume.title ?? null, resumeVersion: application.resumeVersion?.version ?? null })),
    resumes: user.resumes.map(resume => ({ id: resume.id, title: resume.title, version: resume.versions[0]?.version ?? null, text: resume.versions[0] ? JSON.stringify(resume.versions[0].content) : '' })),
    interviews: user.applications.flatMap(application => application.interviews.flatMap(interview => {
      if (!interview.preparation || typeof interview.preparation !== 'object' || Array.isArray(interview.preparation)) return [];
      const preparation = interview.preparation as { technicalTopics?: unknown; checklist?: unknown; materialType?: unknown };
      if (preparation.materialType !== 'preparation_material') return [];
      return [{ applicationId: application.id, stage: interview.stage, topics: Array.isArray(preparation.technicalTopics) ? preparation.technicalTopics.filter((item): item is string => typeof item === 'string') : [], checklist: Array.isArray(preparation.checklist) ? preparation.checklist.filter((item): item is string => typeof item === 'string') : [] }];
    })),
    now: new Date().toISOString(),
  };
}

function storedMessages(value: Prisma.JsonValue): AssistantMessage[] { if (!Array.isArray(value)) return []; return value.flatMap(item => { const parsed = assistantMessageSchema.safeParse(item); return parsed.success ? [parsed.data] : []; }); }
function serialize(conversation: { id: string; title: string | null; messages: Prisma.JsonValue; createdAt: Date; updatedAt: Date }): AssistantConversation { return assistantConversationSchema.parse({ id: conversation.id, title: conversation.title, messages: storedMessages(conversation.messages), createdAt: conversation.createdAt.toISOString(), updatedAt: conversation.updatedAt.toISOString() }); }

export async function askCareerAssistant(userId: string, raw: unknown) {
  const input = assistantAskSchema.parse(raw);
  const context = buildContext(await loadContext(userId));
  const answer = assistantAnswerSchema.parse(await createCareerAssistantProvider().answer(input.question, context));
  const userMessage: AssistantMessage = { id: randomUUID(), role: 'user', content: input.question, evidence: [], createdAt: new Date().toISOString() };
  const assistantMessage: AssistantMessage = { id: randomUUID(), role: 'assistant', content: answer.answer, evidence: answer.evidence, createdAt: new Date().toISOString() };
  const existing = input.conversationId ? await prisma.aIConversation.findFirst({ where: { id: input.conversationId, userId } }) : null;
  if (input.conversationId && !existing) throw new AssistantConversationNotFoundError();
  const messages = [...(existing ? storedMessages(existing.messages) : []), userMessage, assistantMessage];
  const conversation = existing
    ? await prisma.aIConversation.update({ where: { id: existing.id }, data: { messages: messages as Prisma.InputJsonValue } })
    : await prisma.aIConversation.create({ data: { userId, title: input.question.slice(0, 120), messages: messages as Prisma.InputJsonValue } });
  return { conversation: serialize(conversation), answer };
}

export async function listAssistantConversations(userId: string) { const conversations = await prisma.aIConversation.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, take: 50 }); return conversations.map(conversation => ({ id: conversation.id, title: conversation.title, updatedAt: conversation.updatedAt.toISOString(), messageCount: storedMessages(conversation.messages).length })); }
export async function getAssistantConversation(userId: string, id: string) { const conversation = await prisma.aIConversation.findFirst({ where: { id, userId } }); if (!conversation) throw new AssistantConversationNotFoundError(); return serialize(conversation); }
export function careerAssistantErrorStatus(error: unknown) { if (error instanceof z.ZodError) return 400; if (error instanceof AssistantUserNotFoundError || error instanceof AssistantConversationNotFoundError) return 404; if (error instanceof Error && error.name === 'MissingUserError') return 401; return 500; }
