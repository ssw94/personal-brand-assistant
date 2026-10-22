import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import net from 'node:net';
import { researchRequestSchema, researchRunSchema, type ResearchRequest } from '@pba/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

const MAX_SOURCE_BYTES = 1_000_000;
const SOURCE_TTL_MS = 24 * 60 * 60 * 1000;

export class ResearchRunNotFoundError extends Error { constructor() { super('Research run not found'); this.name = 'ResearchRunNotFoundError'; } }
export class ResearchUnavailableError extends Error { constructor() { super('No approved research provider is configured.'); this.name = 'ResearchUnavailableError'; } }
export class ResearchUrlPolicyError extends Error { constructor(message: string) { super(message); this.name = 'ResearchUrlPolicyError'; } }

type FetchedSource = { url: string; title: string | null; content: string; contentHash: string; safety: 'SAFE_DATA' | 'PROMPT_INJECTION_SUSPECTED'; };

function configuredHosts() { return new Set((process.env.RESEARCH_ALLOWED_HOSTS ?? '').split(',').map(host => host.trim().toLowerCase()).filter(Boolean)); }
function privateIp(address: string) {
  if (net.isIPv4(address)) {
    const [a, b = -1] = address.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  if (net.isIPv6(address)) return address === '::1' || address.startsWith('fc') || address.startsWith('fd') || address.startsWith('fe80:') || address === '::';
  return true;
}

export async function assertResearchUrlAllowed(raw: string) {
  let url: URL;
  try { url = new URL(raw); } catch { throw new ResearchUrlPolicyError('Research URL is invalid.'); }
  if (url.protocol !== 'https:') throw new ResearchUrlPolicyError('Research sources must use HTTPS.');
  if (url.username || url.password || url.port) throw new ResearchUrlPolicyError('Research URLs may not include credentials or custom ports.');
  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.internal')) throw new ResearchUrlPolicyError('Internal research hosts are not allowed.');
  const allowed = configuredHosts();
  if (allowed.size === 0 || ![...allowed].some(host => hostname === host || hostname.endsWith(`.${host}`))) throw new ResearchUrlPolicyError('The research host is not allowlisted.');
  const addresses = net.isIP(hostname) ? [hostname] : (await dns.lookup(hostname, { all: true })).map(result => result.address);
  if (!addresses.length || addresses.some(privateIp)) throw new ResearchUrlPolicyError('Research host resolves to a private or loopback address.');
  return url;
}

function safetyFor(content: string): 'SAFE_DATA' | 'PROMPT_INJECTION_SUSPECTED' { return /(ignore (all|previous)|system prompt|developer message|reveal .*secret|tool call)/i.test(content) ? 'PROMPT_INJECTION_SUSPECTED' : 'SAFE_DATA'; }
async function fetchSource(rawUrl: string, signal?: AbortSignal): Promise<FetchedSource> {
  const url = await assertResearchUrlAllowed(rawUrl);
  const response = await fetch(url, { redirect: 'manual', ...(signal ? { signal } : {}), headers: { accept: 'text/html,text/plain,application/xhtml+xml' } });
  if (response.status >= 300 && response.status < 400) throw new ResearchUrlPolicyError('Research redirects are not allowed.');
  if (!response.ok) throw new ResearchUnavailableError();
  const contentType = response.headers.get('content-type') ?? '';
  if (!/(text\/|html|xml)/i.test(contentType)) throw new ResearchUrlPolicyError('Research source is not textual.');
  const contentLength = Number(response.headers.get('content-length') ?? 0);
  if (contentLength > MAX_SOURCE_BYTES) throw new ResearchUrlPolicyError('Research source exceeds the size limit.');
  const content = (await response.text()).slice(0, MAX_SOURCE_BYTES);
  return { url: url.toString(), title: null, content, contentHash: crypto.createHash('sha256').update(content).digest('hex'), safety: safetyFor(content) };
}

type ResearchRunRecord = Prisma.ResearchRunGetPayload<{ include: { sources: { include: { citations: true } } } }>;
function serialize(run: ResearchRunRecord) {
  return researchRunSchema.parse({ id: run.id, query: run.query, status: run.status, provider: run.provider, failureReason: run.failureReason, createdAt: run.createdAt.toISOString(), completedAt: run.completedAt?.toISOString() ?? null, updatedAt: run.updatedAt.toISOString(), sources: run.sources.map(source => ({ id: source.id, runId: source.runId, url: source.url, title: source.title, contentHash: source.contentHash, fetchedAt: source.fetchedAt?.toISOString() ?? null, freshnessUntil: source.freshnessUntil?.toISOString() ?? null, safety: source.safety, createdAt: source.createdAt.toISOString(), citations: source.citations.map(citation => ({ id: citation.id, sourceId: citation.sourceId, claim: citation.claim, quote: citation.quote, locator: citation.locator, createdAt: citation.createdAt.toISOString() })) })) });
}

export async function createResearchRun(userId: string, input: unknown, signal?: AbortSignal) {
  const request: ResearchRequest = researchRequestSchema.parse(input);
  const run = await prisma.researchRun.create({ data: { userId, query: request.query, provider: request.urls.length ? 'allowlisted-fetcher' : 'unavailable', status: request.urls.length ? 'RUNNING' : 'UNAVAILABLE' } });
  if (!request.urls.length) return serialize(await prisma.researchRun.findFirstOrThrow({ where: { id: run.id, userId }, include: { sources: { include: { citations: true } } } }));
  try {
    const fetched = await Promise.all(request.urls.map(url => fetchSource(url, signal)));
    await prisma.$transaction(async tx => {
      for (const source of fetched) await tx.researchSource.create({ data: { userId, runId: run.id, url: source.url, title: source.title, contentHash: source.contentHash, content: source.content, fetchedAt: new Date(), freshnessUntil: new Date(Date.now() + SOURCE_TTL_MS), safety: source.safety } });
      await tx.researchRun.update({ where: { id: run.id, userId }, data: { status: 'COMPLETED', completedAt: new Date() } });
    });
  } catch (error) {
    await prisma.researchRun.update({ where: { id: run.id, userId }, data: { status: error instanceof ResearchUnavailableError ? 'UNAVAILABLE' : 'FAILED', failureReason: error instanceof Error ? error.message : 'Research failed.', completedAt: new Date() } });
  }
  return getResearchRun(userId, run.id);
}

export async function getResearchRun(userId: string, id: string) {
  const run = await prisma.researchRun.findFirst({ where: { id, userId }, include: { sources: { include: { citations: true }, orderBy: { createdAt: 'asc' } } } });
  if (!run) throw new ResearchRunNotFoundError();
  return serialize(run);
}

export async function listResearchRuns(userId: string) {
  const runs = await prisma.researchRun.findMany({ where: { userId }, include: { sources: { include: { citations: true } } }, orderBy: { createdAt: 'desc' }, take: 50 });
  return runs.map(serialize);
}

export function researchErrorStatus(error: unknown) { if (error instanceof ResearchRunNotFoundError) return 404; if (error instanceof ResearchUrlPolicyError) return 400; if (error instanceof ResearchUnavailableError) return 503; return 500; }
