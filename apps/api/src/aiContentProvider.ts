import { contentCritiqueSchema, type ContentCritique } from '@pba/shared';

export type ContentFact = { id: string; text: string };
export type ContentGenerationInput = { title: string; topic: string; audience: string; voice: string; facts: ContentFact[] };
export type ContentGenerationResult = { provider: string; body: string; sourceFactIds: string[] };
export type ContentTransformInput = ContentGenerationInput & { body: string; action: 'rewrite' | 'improve_hook' | 'shorten' | 'expand' | 'regenerate' };
export interface ContentProvider { readonly name: string; generate(input: ContentGenerationInput): Promise<ContentGenerationResult>; transform(input: ContentTransformInput): Promise<ContentGenerationResult>; critique(input: { body: string; facts: ContentFact[] }): Promise<ContentCritique>; }

const terms = (value: string) => [...new Set(value.toLowerCase().match(/[a-z][a-z0-9+#.-]{3,}/g) ?? [])].slice(0, 8);
const relevantFacts = (topic: string, facts: ContentFact[]) => facts.filter(f => terms(topic).some(t => f.text.toLowerCase().includes(t))).slice(0, 4);
const safeBody = (input: ContentGenerationInput, prefix = '') => {
  const facts = relevantFacts(input.topic, input.facts);
  const evidence = facts.length ? facts.map(f => f.text).join(' ') : 'This post is an invitation to reflect on the topic and learn from experience.';
  return `${prefix}${input.topic}\n\n${evidence}\n\nWhat has your experience with this been?`;
};

/** Development provider: it only quotes supplied facts and explicitly labels derived content. */
export class SafeMockContentProvider implements ContentProvider {
  readonly name = 'safe-mock';
  async generate(input: ContentGenerationInput) { const facts = relevantFacts(input.topic, input.facts); return { provider: this.name, body: safeBody(input, ''), sourceFactIds: facts.map(f => f.id) }; }
  async transform(input: ContentTransformInput) { const facts = relevantFacts(input.topic, input.facts); const prefix = input.action === 'improve_hook' ? 'A practical perspective: ' : input.action === 'shorten' ? '' : 'Here is a refined draft based on the same source facts.\n\n'; const body = input.action === 'shorten' ? `${input.body.split(/\n\n/).slice(0, 2).join('\n\n')}\n\nWhat would you add?` : input.action === 'regenerate' ? safeBody(input) : `${prefix}${input.body}`; return { provider: this.name, body: body.slice(0, 3000), sourceFactIds: facts.map(f => f.id) }; }
  async critique(input: { body: string; facts: ContentFact[] }) { const referenced = input.facts.filter(f => input.body.toLowerCase().includes(f.text.toLowerCase().slice(0, 30))); return contentCritiqueSchema.parse({ provider: this.name, summary: 'This is a development critique; verify every claim before publishing.', strengths: referenced.length ? ['Uses supplied profile evidence.'] : ['The draft has a clear topic.'], improvements: ['Add a specific lesson or question from your own experience.', 'Review dates, metrics and technical claims against your profile.'], factStatus: 'critique_only' }); }
}
export function createContentProvider(): ContentProvider { return new SafeMockContentProvider(); }
