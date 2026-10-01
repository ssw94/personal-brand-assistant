import { Prisma } from '@prisma/client';
import { resumeCreateSchema, resumeDocumentSchema, resumeSaveSchema, type ResumeDocument } from '@pba/shared';
import { prisma } from './prisma.js';
import { ProfileNotFoundError } from './profileService.js';

export class ResumeNotFoundError extends Error { constructor() { super('Resume not found'); this.name = 'ResumeNotFoundError'; } }

const profileForResume = { experiences: true, educations: true, skills: true, projects: true, certifications: true, achievements: true } as const;

function defaultDocument(profile: { summary: string | null; experiences: Array<{ id: string }>; educations: Array<{ id: string }>; skills: Array<{ id: string }>; projects: Array<{ id: string }>; certifications: Array<{ id: string }>; achievements: Array<{ id: string }> }): ResumeDocument {
  return {
    summary: profile.summary ?? '',
    sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'achievements'],
    visibleSections: { summary: true, experience: true, education: true, skills: true, projects: true, certifications: true, achievements: true },
    experienceIds: profile.experiences.map(item => item.id),
    educationIds: profile.educations.map(item => item.id),
    skillIds: profile.skills.map(item => item.id),
    projectIds: profile.projects.map(item => item.id),
    certificationIds: profile.certifications.map(item => item.id),
    achievementIds: profile.achievements.map(item => item.id),
    acceptedSuggestionIds: [],
  };
}

export async function ownedResume(userId: string, resumeId: string) {
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId }, include: { versions: { orderBy: { version: 'desc' }, take: 1 }, user: { include: { profile: { include: profileForResume } } } } });
  if (!resume) throw new ResumeNotFoundError();
  return resume;
}

function serialize(resume: Awaited<ReturnType<typeof ownedResume>>) {
  const latest = resume.versions[0];
  return { id: resume.id, title: resume.title, createdAt: resume.createdAt, updatedAt: resume.updatedAt, latestVersion: latest ? { id: latest.id, version: latest.version, content: resumeDocumentSchema.parse(latest.content), createdAt: latest.createdAt } : null, profile: resume.user.profile };
}

export async function listResumes(userId: string) {
  const resumes = await prisma.resume.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, include: { versions: { orderBy: { version: 'desc' }, take: 1 } } });
  return resumes.map(resume => ({ id: resume.id, title: resume.title, createdAt: resume.createdAt, updatedAt: resume.updatedAt, latestVersion: resume.versions[0] ? { id: resume.versions[0].id, version: resume.versions[0].version } : null }));
}

export async function getResume(userId: string, resumeId: string) { return serialize(await ownedResume(userId, resumeId)); }

export async function createResume(userId: string, input: unknown) {
  const { title } = resumeCreateSchema.parse(input);
  const profile = await prisma.profile.findUnique({ where: { userId }, include: profileForResume });
  if (!profile) throw new ProfileNotFoundError();
  const content = defaultDocument(profile);
  const resume = await prisma.resume.create({ data: { userId, title, versions: { create: { version: 1, content: content as Prisma.InputJsonValue } } } });
  return getResume(userId, resume.id);
}

export async function autosaveResume(userId: string, resumeId: string, input: unknown) {
  const { title, content } = resumeSaveSchema.parse(input);
  const resume = await ownedResume(userId, resumeId);
  const latest = resume.versions[0];
  if (!latest) throw new ResumeNotFoundError();
  await prisma.$transaction([prisma.resume.update({ where: { id: resume.id }, data: { title } }), prisma.resumeVersion.update({ where: { id: latest.id }, data: { content: content as Prisma.InputJsonValue } })]);
  return getResume(userId, resume.id);
}

export async function saveResumeVersion(userId: string, resumeId: string, input: unknown) {
  const { title, content } = resumeSaveSchema.parse(input);
  const resume = await ownedResume(userId, resumeId);
  const nextVersion = (resume.versions[0]?.version ?? 0) + 1;
  await prisma.$transaction([prisma.resume.update({ where: { id: resume.id }, data: { title } }), prisma.resumeVersion.create({ data: { resumeId: resume.id, version: nextVersion, content: content as Prisma.InputJsonValue } })]);
  return getResume(userId, resume.id);
}

export async function duplicateResume(userId: string, resumeId: string) {
  const source = await ownedResume(userId, resumeId);
  const content = source.versions[0] ? resumeDocumentSchema.parse(source.versions[0].content) : null;
  if (!content) throw new ResumeNotFoundError();
  const copy = await prisma.resume.create({ data: { userId, title: `Copy of ${source.title}`, versions: { create: { version: 1, content: content as Prisma.InputJsonValue } } } });
  return getResume(userId, copy.id);
}

export async function deleteResume(userId: string, resumeId: string) {
  const resume = await ownedResume(userId, resumeId);
  await prisma.resume.delete({ where: { id: resume.id } });
}
