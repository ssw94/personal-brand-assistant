import { optimizationResultSchema, type OptimizationResult } from '@pba/shared';

export type ResumeOptimizationInput = { jobDescription: string; summary: string; facts: Array<{ id: string; text: string }> };
export interface ResumeOptimizationProvider { readonly name: string; optimize(input: ResumeOptimizationInput): Promise<OptimizationResult>; }

const stopWords = new Set('about after again against all also and are because been before being between both but can could did does doing during each for from had has have having how into its itself may more most must not now of on once only other our out over same should some such than that their them then these they this through to under until very was were what when where which while who will with would you your'.split(' '));
function terms(value: string) { return [...new Set((value.toLowerCase().match(/[a-z][a-z0-9+#.-]{3,}/g) ?? []).filter(term => !stopWords.has(term)))].slice(0, 40); }
function suggestion(id: string, category: OptimizationResult['suggestions'][number]['category'], title: string, rationale: string, suggestedText: string, evidenceTerms: string[], sourceFactIds: string[]) { return { id, category, title, rationale, suggestedText, evidenceTerms, sourceFactIds, factStatus: 'suggestion' as const, status: 'pending' as const }; }

export class SafeMockResumeOptimizer implements ResumeOptimizationProvider {
  readonly name = 'safe-mock';
  async optimize(input: ResumeOptimizationInput) {
    const jobTerms = terms(input.jobDescription); const factText = `${input.summary} ${input.facts.map(fact => fact.text).join(' ')}`.toLowerCase();
    const matched = jobTerms.filter(term => factText.includes(term)); const missing = jobTerms.filter(term => !factText.includes(term)).slice(0, 12);
    const suggestions: OptimizationResult['suggestions'] = [];
    if (matched.length) suggestions.push(suggestion('keyword-alignment', 'keyword_alignment', 'Align wording with the target role', 'These terms already appear in the supplied resume/profile facts.', `Use exact language such as ${matched.slice(0, 6).join(', ')} where it truthfully describes your existing work.`, matched.slice(0, 10), input.facts.map(fact => fact.id).slice(0, 10)));
    for (const term of missing.slice(0, 6)) suggestions.push(suggestion(`missing-${term}`, 'missing_skill', `Review the “${term}” requirement`, 'This term appears in the job description but was not found in the supplied resume/profile facts.', `Consider addressing “${term}” only if it accurately reflects your experience; do not add it as a skill without evidence.`, [term], []));
    for (const fact of input.facts.filter(fact => fact.id.startsWith('experience:')).slice(0, 3)) {
      suggestions.push(suggestion(`bullet-${fact.id}`, 'bullet_improvement', 'Strengthen an experience bullet', 'The existing experience is preserved as a source fact; the improvement is a writing prompt, not a new responsibility.', 'Rewrite an existing bullet as action + scope + result. Add a real metric only when you can verify it.', [], [fact.id]));
      suggestions.push(suggestion(`metric-${fact.id}`, 'measurable_achievement', 'Add a verified measurable outcome', 'The supplied facts do not contain a metric for this experience entry.', 'If accurate, add a measurable outcome such as time saved, scale, reliability, revenue, adoption, or delivery speed. Do not guess the number.', [], [fact.id]));
    }
    if (input.summary.trim()) suggestions.push(suggestion('summary-improvement', 'summary', 'Make the summary more targeted', 'The current summary is supplied by the user and remains unchanged until they choose an edit.', `Keep the existing claims and connect them to relevant target terms only where truthful: ${matched.slice(0, 5).join(', ') || 'the role’s core requirements'}.`, matched.slice(0, 5), []));
    suggestions.push(suggestion('ats-format', 'ats', 'Keep the format ATS-friendly', 'This is a formatting recommendation, not a claim about the candidate.', 'Prefer standard section headings, plain text dates, readable bullets, and avoid tables, columns, graphics, headers/footers, or keyword stuffing.', [], []));
    if (!missing.length) suggestions.push(suggestion('irrelevant-review', 'irrelevant_content', 'Review content for role relevance', 'No obvious missing terms were identified by the safe provider.', 'Review each selected project and achievement and remove only content that is genuinely unrelated to this target role.', [], []));
    return optimizationResultSchema.parse({ provider: this.name, keywordAlignment: { matched, missing }, atsConsiderations: ['Use standard headings and plain text.', 'Keep claims grounded in supplied facts.', 'Avoid keyword stuffing and visual-only information.'], suggestions });
  }
}

export function createResumeOptimizationProvider(): ResumeOptimizationProvider { return new SafeMockResumeOptimizer(); }
