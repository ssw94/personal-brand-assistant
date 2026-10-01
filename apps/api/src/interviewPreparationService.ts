import { Prisma } from '@prisma/client';
import { interviewAnswerSchema, interviewPreparationRequestSchema, interviewPreparationResponseSchema, interviewPreparationSchema, interviewPreparationUpdateSchema, interviewStageSchema, type InterviewPreparationResponse } from '@pba/shared';
import { z } from 'zod';
import { prisma } from './prisma.js';
import { createInterviewPreparationProvider, type InterviewFact } from './aiInterviewProvider.js';

export class InterviewApplicationNotFoundError extends Error { constructor() { super('Application not found'); this.name = 'InterviewApplicationNotFoundError'; } }
export class InterviewPreparationNotFoundError extends Error { constructor() { super('Interview preparation not found'); this.name = 'InterviewPreparationNotFoundError'; } }

const profileInclude = { experiences: true, educations: true, skills: true, projects: true, certifications: true, achievements: true } as const;
const applicationInclude = { job: true, interviews: { orderBy: { updatedAt: 'desc' as const }, take: 1 }, resumeVersion: { include: { resume: { include: { user: { include: { profile: { include: profileInclude } } } } } } } } as const;
type OwnedApplication = Awaited<ReturnType<typeof ownedApplication>>;

async function ownedApplication(userId: string, applicationId: string) {
  const application = await prisma.application.findFirst({ where: { id: applicationId, userId }, include: applicationInclude });
  if (!application) throw new InterviewApplicationNotFoundError();
  return application;
}

function factsFromApplication(application: OwnedApplication): InterviewFact[] {
  const profile = application.resumeVersion?.resume.user.profile;
  if (!profile) return [];
  return [
    ...profile.experiences.map(item => ({ id: `experience:${item.id}`, text: `${item.title} at ${item.company}. ${item.description ?? ''}` })),
    ...profile.educations.map(item => ({ id: `education:${item.id}`, text: `${item.degree}${item.field ? ` in ${item.field}` : ''} at ${item.institution}` })),
    ...profile.skills.map(item => ({ id: `skill:${item.id}`, text: item.name })),
    ...profile.projects.map(item => ({ id: `project:${item.id}`, text: `${item.name}. ${item.description ?? ''}` })),
    ...profile.certifications.map(item => ({ id: `certification:${item.id}`, text: `${item.name}${item.issuer ? ` from ${item.issuer}` : ''}` })),
    ...profile.achievements.map(item => ({ id: `achievement:${item.id}`, text: `${item.title}. ${item.description ?? ''}` })),
  ];
}

function serialize(interview: NonNullable<OwnedApplication['interviews'][number]>): InterviewPreparationResponse {
  const preparation = interviewPreparationSchema.parse(interview.preparation);
  const answers = (Array.isArray(interview.answers) ? interview.answers : []).map(answer => interviewAnswerSchema.parse(answer));
  return interviewPreparationResponseSchema.parse({ id: interview.id, applicationId: interview.applicationId, stage: interviewStageSchema.parse(interview.stage), scheduledAt: interview.scheduledAt?.toISOString() ?? null, notes: interview.notes ?? '', answers, preparation, createdAt: interview.createdAt.toISOString(), updatedAt: interview.updatedAt.toISOString() });
}

export async function getInterviewPreparation(userId: string, applicationId: string) {
  const application = await ownedApplication(userId, applicationId);
  return application.interviews[0] ? serialize(application.interviews[0]) : null;
}

export async function generateInterviewPreparation(userId: string, applicationId: string, raw: unknown) {
  const value = interviewPreparationRequestSchema.parse(raw);
  const application = await ownedApplication(userId, applicationId);
  const candidateFacts = factsFromApplication(application);
  const result = await createInterviewPreparationProvider().prepare({ role: application.job.title, company: application.job.company, jobDescription: application.job.description ?? '', stage: value.stage, facts: candidateFacts });
  const existing = application.interviews[0];
  const data = { stage: value.stage, scheduledAt: value.scheduledAt ? new Date(value.scheduledAt) : null, notes: value.notes, preparation: result as Prisma.InputJsonValue };
  const interview = existing
    ? await prisma.interview.update({ where: { id: existing.id }, data })
    : await prisma.interview.create({ data: { applicationId, ...data, answers: [] } });
  return serialize(interview);
}

export async function updateInterviewPreparation(userId: string, applicationId: string, raw: unknown) {
  const value = interviewPreparationUpdateSchema.parse(raw);
  const application = await ownedApplication(userId, applicationId);
  const existing = application.interviews[0];
  if (!existing) throw new InterviewPreparationNotFoundError();
  const data = {
    ...(value.stage !== undefined ? { stage: value.stage } : {}),
    ...(value.scheduledAt !== undefined ? { scheduledAt: value.scheduledAt ? new Date(value.scheduledAt) : null } : {}),
    ...(value.notes !== undefined ? { notes: value.notes } : {}),
    ...(value.answers !== undefined ? { answers: value.answers as Prisma.InputJsonValue } : {}),
  };
  return serialize(await prisma.interview.update({ where: { id: existing.id }, data }));
}

export function interviewPreparationErrorStatus(error: unknown) { if (error instanceof z.ZodError) return 400; if (error instanceof InterviewApplicationNotFoundError || error instanceof InterviewPreparationNotFoundError) return 404; if (error instanceof Error && error.name === 'MissingUserError') return 401; return 500; }
