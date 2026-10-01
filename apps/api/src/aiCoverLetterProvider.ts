import { coverLetterResultSchema, type CoverLetterResult } from '@pba/shared';

export type CoverLetterFact = { id: string; text: string };
export type CoverLetterInput = { company: string; role: string; jobDescription: string; candidateName: string; summary: string; facts: CoverLetterFact[] };
export interface CoverLetterProvider { readonly name: string; generate(input: CoverLetterInput): Promise<CoverLetterResult>; }

const stopWords = new Set('about after again against all also and are because been before being between both but can could did does doing during each for from had has have having how into its itself may more most must not now of on once only other our out over same should some such than that their them then these they this through to under until very was were what when where which while who will with would you your'.split(' '));
const terms = (value: string) => [...new Set((value.toLowerCase().match(/[a-z][a-z0-9+#.-]{3,}/g) ?? []).filter(term => !stopWords.has(term)))].slice(0, 35);

/** Safe development provider: every claim is selected from supplied profile/resume facts. */
export class SafeMockCoverLetterProvider implements CoverLetterProvider {
  readonly name = 'safe-mock';
  async generate(input: CoverLetterInput) {
    const jobTerms = terms(input.jobDescription);
    const relevant = input.facts.filter(fact => jobTerms.some(term => fact.text.toLowerCase().includes(term))).slice(0, 4);
    const relevantTerms = [...new Set(relevant.flatMap(fact => jobTerms.filter(term => fact.text.toLowerCase().includes(term))))].slice(0, 5);
    const sourceFactIds = relevant.map(fact => fact.id);
    const greetingName = input.candidateName.trim() || 'Candidate';
    const paragraphs = [
      `Dear ${input.company} hiring team,`,
      `I am writing to express my interest in the ${input.role} role at ${input.company}. ${input.summary.trim() || 'My professional background is represented in the attached resume.'}`,
      relevant.length
        ? `My background includes ${relevant.map(fact => fact.text.split(' ').slice(0, 18).join(' ')).join('; ')}.${relevantTerms.length ? ` This aligns with the role's focus on ${relevantTerms.join(', ')}.` : ''}`
        : 'I would welcome the opportunity to discuss how the experience documented in my resume may align with this role.',
      'I would be glad to discuss the role and provide any additional information that would help with your evaluation.',
      `Sincerely,\n${greetingName}`,
    ];
    return coverLetterResultSchema.parse({ provider: this.name, content: paragraphs.join('\n\n'), sourceFactIds, factStatus: 'derived_from_user_facts' });
  }
}

export function createCoverLetterProvider(): CoverLetterProvider { return new SafeMockCoverLetterProvider(); }
