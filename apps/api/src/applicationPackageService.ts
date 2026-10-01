import { applicationPackageRequestSchema, applicationPackageSchema, coverLetterRequestSchema, coverLetterUpdateSchema, resumeDocumentSchema, type ApplicationPackageRequest } from '@pba/shared';
import { z } from 'zod';
import { prisma } from './prisma.js';
import { createCoverLetterProvider, type CoverLetterFact } from './aiCoverLetterProvider.js';
import { ownedResume, ResumeNotFoundError } from './resumeService.js';
import { JobNotFoundError } from './jobService.js';

export class CoverLetterNotFoundError extends Error { constructor() { super('Cover letter not found'); this.name = 'CoverLetterNotFoundError'; } }

function factsFromResume(resume: Awaited<ReturnType<typeof ownedResume>>): { name: string; summary: string; facts: CoverLetterFact[] } {
  const profile = resume.user.profile;
  if (!profile || !resume.versions[0]) throw new ResumeNotFoundError();
  const facts: CoverLetterFact[] = [
    ...profile.experiences.map(item => ({ id: `experience:${item.id}`, text: `${item.title} at ${item.company}. ${item.description ?? ''}` })),
    ...profile.educations.map(item => ({ id: `education:${item.id}`, text: `${item.degree}${item.field ? ` in ${item.field}` : ''} at ${item.institution}` })),
    ...profile.skills.map(item => ({ id: `skill:${item.id}`, text: item.name })),
    ...profile.projects.map(item => ({ id: `project:${item.id}`, text: `${item.name}. ${item.description ?? ''}` })),
    ...profile.certifications.map(item => ({ id: `certification:${item.id}`, text: `${item.name}${item.issuer ? ` from ${item.issuer}` : ''}` })),
    ...profile.achievements.map(item => ({ id: `achievement:${item.id}`, text: `${item.title}. ${item.description ?? ''}` })),
  ];
  return { name: [profile.firstName, profile.lastName].filter(Boolean).join(' '), summary: resume.versions[0].content && typeof resume.versions[0].content === 'object' && !Array.isArray(resume.versions[0].content) && typeof (resume.versions[0].content as Record<string, unknown>).summary === 'string' ? (resume.versions[0].content as Record<string, unknown>).summary as string : profile.summary ?? '', facts };
}

function terms(value: string) { return [...new Set((value.toLowerCase().match(/[a-z][a-z0-9+#.-]{3,}/g) ?? []).filter(term => !new Set('about after again against all also and are because been before being between both but can could did does doing during each for from had has have having how into its itself may more most must not now of on once only other our out over same should some such than that their them then these they this through to under until very was were what when where which while who will with would you your'.split(' ')).has(term)))].slice(0, 25); }
function buildFactsText(facts: CoverLetterFact[]) { return facts.map(fact => fact.text.toLowerCase()).join(' '); }

async function inputFor(userId: string, raw: unknown) {
  const input = coverLetterRequestSchema.parse(raw);
  const resume = await ownedResume(userId, input.resumeId);
  const facts = factsFromResume(resume);
  return { input, resume, facts };
}

export async function generateCoverLetter(userId: string, raw: unknown) {
  const { input, facts } = await inputFor(userId, raw);
  const result = await createCoverLetterProvider().generate({ ...input, candidateName: facts.name, summary: facts.summary, facts: facts.facts });
  const record = await prisma.coverLetter.create({ data: { userId, resumeId: input.resumeId, company: input.company, role: input.role, jobDescription: input.jobDescription, provider: result.provider, content: result.content, sourceFactIds: result.sourceFactIds } });
  return { ...record, result };
}

export async function updateCoverLetter(userId: string, id: string, raw: unknown) {
  const value = coverLetterUpdateSchema.parse(raw);
  const existing = await prisma.coverLetter.findFirst({ where: { id, userId } });
  if (!existing) throw new CoverLetterNotFoundError();
  return prisma.coverLetter.update({ where: { id }, data: { content: value.content } });
}

export async function getCoverLetter(userId: string, id: string) {
  const record = await prisma.coverLetter.findFirst({ where: { id, userId } });
  if (!record) throw new CoverLetterNotFoundError();
  return record;
}

export async function generateApplicationPackage(userId: string, raw: unknown) {
  const request = applicationPackageRequestSchema.parse(raw);
  const { input, resume, facts } = await inputFor(userId, request);
  const description = input.jobDescription;
  if (request.jobId) {
    const job = await prisma.job.findFirst({ where: { id: request.jobId, userId } });
    if (!job) throw new JobNotFoundError();
  }
  const result = await createCoverLetterProvider().generate({ ...input, candidateName: facts.name, summary: facts.summary, facts: facts.facts });
  const jobTerms = terms(description);
  const text = buildFactsText(facts.facts);
  const skillsMatch = jobTerms.filter(term => text.includes(term));
  const skillsGap = jobTerms.filter(term => !text.includes(term)).slice(0, 12);
  const matchedFactIds = facts.facts.filter(fact => skillsMatch.some(term => fact.text.toLowerCase().includes(term))).map(fact => fact.id).slice(0, 6);
  const latest = resume.versions[0];
  if (!latest) throw new ResumeNotFoundError();
  const savedLetter = await prisma.coverLetter.create({ data: { userId, resumeId: input.resumeId, company: input.company, role: input.role, jobDescription: input.jobDescription, provider: result.provider, content: result.content, sourceFactIds: result.sourceFactIds } });
  const packageValue = applicationPackageSchema.parse({
    resume: { id: resume.id, title: resume.title, versionId: latest.id, version: latest.version, content: resumeDocumentSchema.parse(latest.content) },
    coverLetterId: savedLetter.id,
    coverLetter: result,
    skillsMatch,
    skillsGap,
    interviewPreparation: jobTerms.slice(0, 5).map(term => ({ question: `How would you demonstrate your experience with ${term}?`, preparation: matchedFactIds.length ? 'Prepare a specific example from the linked profile facts; do not add claims that are not documented.' : 'Review the requirement and prepare an honest answer based on your documented experience.', sourceFactIds: matchedFactIds })),
    checklist: ['Review every resume claim for accuracy.', 'Edit the cover letter in your own voice.', 'Confirm the selected resume version is the one you want to submit.', 'Verify the application URL and closing date before applying.', 'Prepare examples for the matched skills and be ready to discuss gaps honestly.'],
  });
  return packageValue;
}

export const parseApplicationPackageRequest = (input: unknown): ApplicationPackageRequest => applicationPackageRequestSchema.parse(input);
export function applicationPackageErrorStatus(error: unknown) { if (error instanceof z.ZodError) return 400; if (error instanceof CoverLetterNotFoundError || error instanceof ResumeNotFoundError || error instanceof JobNotFoundError) return 404; if (error instanceof Error && error.name === 'MissingUserError') return 401; return 500; }
