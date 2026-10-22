import crypto from 'node:crypto';
import { prisma } from './prisma.js';
import { assertFeatureEntitled } from './usageService.js';

export class LinkedInConfigurationError extends Error { constructor(message: string) { super(message); this.name = 'LinkedInConfigurationError'; } }
export class LinkedInOAuthError extends Error { constructor(message: string) { super(message); this.name = 'LinkedInOAuthError'; } }
export class LinkedInPublishError extends Error { constructor(message: string) { super(message); this.name = 'LinkedInPublishError'; } }

function config() { const clientId = process.env.LINKEDIN_CLIENT_ID?.trim(); const clientSecret = process.env.LINKEDIN_CLIENT_SECRET?.trim(); const redirectUri = process.env.LINKEDIN_REDIRECT_URI?.trim(); const encryptionKey = process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY?.trim(); if (!clientId || !clientSecret || !redirectUri || !encryptionKey) throw new LinkedInConfigurationError('LinkedIn OAuth is not configured.'); const key = Buffer.from(encryptionKey, 'base64'); if (key.length !== 32) throw new LinkedInConfigurationError('LinkedIn token encryption key must be 32 bytes of base64.'); return { clientId, clientSecret, redirectUri, key, apiBase: (process.env.LINKEDIN_API_BASE_URL?.trim() || 'https://api.linkedin.com').replace(/\/$/, ''), version: process.env.LINKEDIN_VERSION?.trim() || '202601' }; }
function hash(value: string) { return crypto.createHash('sha256').update(value).digest('hex'); }
function encrypt(value: string, key: Buffer) { const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', key, iv); const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]); return `${iv.toString('base64')}.${cipher.getAuthTag().toString('base64')}.${ciphertext.toString('base64')}`; }
function decrypt(value: string, key: Buffer) { const [ivRaw, tagRaw, ciphertextRaw] = value.split('.'); if (!ivRaw || !tagRaw || !ciphertextRaw) throw new LinkedInConfigurationError('Stored LinkedIn token is invalid.'); const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivRaw, 'base64')); decipher.setAuthTag(Buffer.from(tagRaw, 'base64')); return Buffer.concat([decipher.update(Buffer.from(ciphertextRaw, 'base64')), decipher.final()]).toString('utf8'); }
function verifier() { return crypto.randomBytes(32).toString('base64url'); }

export async function startLinkedInOAuth(userId: string) {
  const settings = config(); const state = crypto.randomBytes(32).toString('base64url'); const codeVerifier = verifier();
  await prisma.oAuthState.create({ data: { userId, provider: 'linkedin', stateHash: hash(state), codeVerifierHash: hash(codeVerifier), redirectUri: settings.redirectUri, expiresAt: new Date(Date.now() + 10 * 60 * 1000) } });
  const url = new URL('https://www.linkedin.com/oauth/v2/authorization'); url.searchParams.set('response_type', 'code'); url.searchParams.set('client_id', settings.clientId); url.searchParams.set('redirect_uri', settings.redirectUri); url.searchParams.set('state', state); url.searchParams.set('scope', process.env.LINKEDIN_SCOPES?.trim() || 'openid profile w_member_social');
  return { authorizationUrl: url.toString(), state, codeVerifier };
}

export async function completeLinkedInOAuth(input: { state: string; code: string; codeVerifier: string }) {
  const settings = config(); const state = await prisma.oAuthState.findFirst({ where: { provider: 'linkedin', stateHash: hash(input.state), consumedAt: null, expiresAt: { gt: new Date() } } }); if (!state || hash(input.codeVerifier) !== state.codeVerifierHash) throw new LinkedInOAuthError('Invalid or expired LinkedIn OAuth state.'); const userId = state.userId;
  const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code: input.code, client_id: settings.clientId, client_secret: settings.clientSecret, redirect_uri: state.redirectUri }) });
  if (!tokenResponse.ok) throw new LinkedInOAuthError('LinkedIn token exchange failed.'); const token = await tokenResponse.json() as { access_token?: string; expires_in?: number; scope?: string }; if (!token.access_token) throw new LinkedInOAuthError('LinkedIn did not return an access token.');
  const profileResponse = await fetch(`${settings.apiBase}/v2/userinfo`, { headers: { authorization: `Bearer ${token.access_token}` } }); if (!profileResponse.ok) throw new LinkedInOAuthError('LinkedIn profile lookup failed.'); const profile = await profileResponse.json() as { sub?: string; name?: string }; if (!profile.sub) throw new LinkedInOAuthError('LinkedIn profile did not return a member identifier.');
  const account = await prisma.$transaction(async tx => { await tx.oAuthState.update({ where: { id: state.id }, data: { consumedAt: new Date() } }); return tx.linkedInAccount.upsert({ where: { userId_providerMemberId: { userId, providerMemberId: profile.sub! } }, create: { userId, providerMemberId: profile.sub!, displayName: profile.name ?? null, scopes: (token.scope ?? '').split(' ').filter(Boolean), accessTokenCiphertext: encrypt(token.access_token!, settings.key), accessTokenExpiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null }, update: { displayName: profile.name ?? null, scopes: (token.scope ?? '').split(' ').filter(Boolean), accessTokenCiphertext: encrypt(token.access_token!, settings.key), accessTokenExpiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null, disconnectedAt: null } }); });
  return { id: account.id, providerMemberId: account.providerMemberId, displayName: account.displayName, scopes: account.scopes, connectedAt: account.connectedAt.toISOString() };
}

export async function publishApprovedDraft(userId: string, draftId: string, accountId: string) {
  await assertFeatureEntitled(userId, 'publishing');
  const settings = config(); const draft = await prisma.contentDraft.findFirst({ where: { id: draftId, userId, status: 'APPROVED' }, include: { revisions: { orderBy: { version: 'desc' }, take: 1 } } }); if (!draft || !draft.revisions[0]) throw new LinkedInPublishError('Only an approved draft with a revision can be published.');
  const account = await prisma.linkedInAccount.findFirst({ where: { id: accountId, userId, disconnectedAt: null } }); if (!account) throw new LinkedInPublishError('LinkedIn account is not connected.');
  const token = decrypt(account.accessTokenCiphertext, settings.key); const attempt = await prisma.publishingAttempt.create({ data: { userId, draftId, revisionId: draft.revisions[0].id, status: 'STARTED' } });
  try {
    const response = await fetch(`${settings.apiBase}${process.env.LINKEDIN_PUBLISH_PATH?.trim() || '/rest/posts'}`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0', 'LinkedIn-Version': settings.version }, body: JSON.stringify({ author: `urn:li:person:${account.providerMemberId}`, commentary: { text: draft.revisions[0].body }, visibility: 'PUBLIC', distribution: { feedDistribution: 'MAIN_FEED' }, lifecycleState: 'PUBLISHED' }) });
    const providerPostId = response.headers.get('x-restli-id') ?? ((await response.json().catch(() => ({}))) as { id?: string }).id;
    if (!response.ok || !providerPostId) throw new LinkedInPublishError('LinkedIn did not confirm publication.');
    const published = await prisma.$transaction(async tx => { const post = await tx.publishedPost.create({ data: { userId, accountId, draftId, revisionId: draft.revisions[0]!.id, providerPostId, publishedAt: new Date() } }); await tx.publishingAttempt.update({ where: { id: attempt.id }, data: { status: 'CONFIRMED', providerStatus: response.status, providerPostId, publishedPostId: post.id } }); await tx.contentDraft.update({ where: { id: draftId, userId }, data: { status: 'PUBLISHED', publishedAt: new Date() } }); return post; });
    return { id: published.id, providerPostId: published.providerPostId, status: published.status, publishedAt: published.publishedAt.toISOString() };
  } catch (error) { await prisma.publishingAttempt.update({ where: { id: attempt.id }, data: { status: 'FAILED', errorCode: error instanceof LinkedInPublishError ? error.message : 'PROVIDER_ERROR' } }).catch(() => undefined); throw error; }
}

export function linkedinErrorStatus(error: unknown) { if (error instanceof LinkedInConfigurationError) return 503; if (error instanceof LinkedInOAuthError) return 401; if (error instanceof LinkedInPublishError) return 409; return 500; }
