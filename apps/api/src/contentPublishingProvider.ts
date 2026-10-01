export type PublishInput = { title: string; body: string; scheduledAt?: Date | null };
export type PublishResult = { provider: string; externalId: string | null; status: 'published' | 'failed'; reason?: string };
export interface ContentPublishingProvider { readonly name: string; publish(input: PublishInput): Promise<PublishResult>; }
/** A credential-free boundary for future LinkedIn/API providers. It never sends data externally. */
export class SafeMockPublishingProvider implements ContentPublishingProvider { readonly name = 'safe-mock'; async publish(input: PublishInput) { if (!input.body.trim()) return { provider: this.name, externalId: null, status: 'failed' as const, reason: 'Draft body is empty.' }; return { provider: this.name, externalId: null, status: 'published' as const }; } }
export function createPublishingProvider(): ContentPublishingProvider { return new SafeMockPublishingProvider(); }
