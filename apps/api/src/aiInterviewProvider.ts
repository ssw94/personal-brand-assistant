import { interviewPreparationSchema, type InterviewPreparation } from '@pba/shared';

export type InterviewFact = { id: string; text: string };
export type InterviewPreparationInput = { role: string; company: string; jobDescription: string; stage: string; facts: InterviewFact[] };
export interface InterviewPreparationProvider { readonly name: string; prepare(input: InterviewPreparationInput): Promise<InterviewPreparation>; }

const stopWords = new Set('about after again against all also and are because been before being between both but can could did does doing during each for from had has have having how into its itself may more most must not now of on once only other our out over same should some such than that their them then these they this through to under until very was were what when where which while who will with would you your'.split(' '));
const terms = (value: string) => [...new Set((value.toLowerCase().match(/[a-z][a-z0-9+#.-]{3,}/g) ?? []).filter(term => !stopWords.has(term)))].slice(0, 30);
const question = (id: string, text: string, sourceFactIds: string[] = []) => ({ id, question: text, sourceFactIds });

/** Safe development provider. It creates prompts, not predictions, and never creates candidate facts. */
export class SafeMockInterviewProvider implements InterviewPreparationProvider {
  readonly name = 'safe-mock';
  async prepare(input: InterviewPreparationInput) {
    const jobTerms = terms(input.jobDescription);
    const factText = input.facts.map(fact => ({ ...fact, lower: fact.text.toLowerCase() }));
    const matchedTerms = jobTerms.filter(term => factText.some(fact => fact.lower.includes(term)));
    const technicalTerms = jobTerms.filter(term => /api|backend|frontend|cloud|data|database|deploy|distributed|infrastructure|kubernetes|observability|performance|platform|security|software|system|test|typescript|javascript|python|java|react|sql/.test(term));
    const categories = [
      technicalTerms.some(term => /system|distributed|platform|backend|api/.test(term)) ? 'Architecture and systems' : '',
      technicalTerms.some(term => /cloud|deploy|infrastructure|kubernetes|observability/.test(term)) ? 'Cloud and operations' : '',
      technicalTerms.some(term => /test|security|performance/.test(term)) ? 'Quality, security and performance' : '',
      input.stage.includes('Behavioral') || input.stage === 'Final Interview' ? 'Communication and collaboration' : '',
    ].filter(Boolean);
    const resumeFacts = factText.filter(fact => fact.id.startsWith('experience:') || fact.id.startsWith('project:')).slice(0, 4);
    const resumeQuestions = resumeFacts.map(fact => question(`resume-${fact.id}`, `Walk us through your work represented by this resume entry: ${fact.text.split('. ')[0]}.`, [fact.id]));
    const roleSpecificQuestions = (matchedTerms.length ? matchedTerms : jobTerms.slice(0, 4)).map(term => question(`role-${term}`, `How would you approach the ${term} responsibilities described for this ${input.role} role?`, factText.filter(fact => fact.lower.includes(term)).map(fact => fact.id).slice(0, 3)));
    const behavioralQuestions = [
      question('behavioral-collaboration', 'Tell us about a time you had to align with others on a difficult technical decision.', resumeFacts.slice(0, 2).map(fact => fact.id)),
      question('behavioral-ambiguity', 'Tell us about a time requirements were unclear. How did you create clarity and make progress?', resumeFacts.slice(0, 2).map(fact => fact.id)),
      question('behavioral-learning', 'Describe a time you received feedback or encountered a setback and what you changed afterward.', resumeFacts.slice(0, 1).map(fact => fact.id)),
    ];
    return interviewPreparationSchema.parse({
      materialType: 'preparation_material',
      disclaimer: 'These are preparation prompts based on the selected job and your supplied resume facts, not guaranteed interview questions.',
      technicalTopics: technicalTerms.length ? technicalTerms : ['Review the technical requirements stated in the job description'],
      likelyTopicCategories: categories.length ? categories : ['Role responsibilities', 'Communication and collaboration'],
      resumeQuestions,
      behavioralQuestions,
      roleSpecificQuestions,
      checklist: ['Review the selected job description and identify examples you can verify.', 'Prepare concise STAR stories using only your real experience.', 'Revisit the technical topics listed above without assuming they will be asked.', 'Prepare questions about the role, team, success measures and next steps.', 'Bring honest explanations for requirements that are not represented in your resume.'],
    });
  }
}

export function createInterviewPreparationProvider(): InterviewPreparationProvider { return new SafeMockInterviewProvider(); }
