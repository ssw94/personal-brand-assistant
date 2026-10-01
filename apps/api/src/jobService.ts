import { jobSchema, savedJobSchema } from '@pba/shared';
import { prisma } from './prisma.js';

export class JobNotFoundError extends Error { constructor() { super('Job not found'); this.name = 'JobNotFoundError'; } }
function dates<T extends { postedDate: string | null }>(input: T): Omit<T, 'postedDate'> & { postedDate: Date | null } { return { ...input, postedDate: input.postedDate ? new Date(input.postedDate) : null }; }
const jobInclude = { savedJob: true } as const;
export async function listJobs(userId: string, filters: { search?: string | undefined; saved?: boolean | undefined; remoteStatus?: string | undefined }) { const search = filters.search?.trim(); const jobs = await prisma.job.findMany({ where: { userId, ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { company: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }] } : {}), ...(filters.remoteStatus ? { remoteStatus: filters.remoteStatus } : {}), ...(filters.saved ? { savedJob: { isNot: null } } : {}) }, orderBy: { updatedAt: 'desc' }, take: 100, include: jobInclude }); return jobs; }
export async function getJob(userId: string, id: string) { const job = await prisma.job.findFirst({ where: { id, userId }, include: jobInclude }); if (!job) throw new JobNotFoundError(); return job; }
export async function createJob(userId: string, input: unknown) { const value = jobSchema.parse(input); return prisma.job.create({ data: { ...dates(value), userId, url: value.applicationUrl || null }, include: jobInclude }); }
export async function updateJob(userId: string, id: string, input: unknown) { const value = jobSchema.parse(input); const result = await prisma.job.updateMany({ where: { id, userId }, data: { ...dates(value), url: value.applicationUrl || null } }); if (!result.count) throw new JobNotFoundError(); return getJob(userId, id); }
export async function deleteJob(userId: string, id: string) { await getJob(userId, id); await prisma.job.delete({ where: { id } }); }
export async function saveJob(userId: string, id: string, input: unknown) { await getJob(userId, id); const value = savedJobSchema.parse(input); return prisma.savedJob.upsert({ where: { jobId: id }, create: { jobId: id, ...value }, update: value }); }
export async function unsaveJob(userId: string, id: string) { await getJob(userId, id); await prisma.savedJob.deleteMany({ where: { jobId: id } }); }
