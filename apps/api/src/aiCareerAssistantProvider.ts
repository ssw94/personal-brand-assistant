import { assistantAnswerSchema, type AssistantAnswer, type AssistantEvidence } from '@pba/shared';

export type AssistantJob = { id: string; title: string; company: string; description: string; skills: string[] };
export type AssistantApplication = { id: string; title: string; company: string; status: string; followUpDate: string | null; interviewDate: string | null; resumeTitle: string | null; resumeVersion: number | null };
export type AssistantResume = { id: string; title: string; version: number | null; text: string };
export type AssistantInterview = { applicationId: string; stage: string; topics: string[]; checklist: string[] };
export type CareerAssistantContext = { profile: { targetRoles: string[]; skills: string[]; headline: string; summary: string }; jobs: AssistantJob[]; applications: AssistantApplication[]; resumes: AssistantResume[]; interviews: AssistantInterview[]; now: string };

const stopWords = new Set('about after again against all also and are because been before being between both but can could did does doing during each for from had has have having how into its itself may more most must not now of on once only other our out over same should some such than that their them then these they this through to under until very was were what when where which while who will with would you your'.split(' '));
const terms = (value: string) => [...new Set((value.toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) ?? []).filter(term => !stopWords.has(term)))];
const normalized = (value: string) => value.trim().toLowerCase();
const evidence = (type: AssistantEvidence['type'], id: string, label: string, detail: string): AssistantEvidence => ({ type, id, label, detail });
const list = (values: string[]) => values.length ? values.map(value => `• ${value}`).join('\n') : 'No matching records were found in your workspace.';

export interface CareerAssistantProvider { readonly name: string; answer(question: string, context: CareerAssistantContext): Promise<AssistantAnswer>; }

/** Credential-free provider. It answers from a server-side context snapshot and never fills gaps with invented facts. */
export class SafeMockCareerAssistantProvider implements CareerAssistantProvider {
  readonly name = 'safe-mock';
  async answer(question: string, context: CareerAssistantContext) {
    const lower = question.toLowerCase();
    const activeStatuses = new Set(['Rejected', 'Withdrawn']);
    const active = context.applications.filter(application => !activeStatuses.has(application.status));
    if (/follow.?up|remind|next step/.test(lower)) {
      const now = new Date(context.now).getTime();
      const due = context.applications.filter(application => application.followUpDate && new Date(application.followUpDate).getTime() <= now);
      return this.result('follow_up', due.length ? `Applications with a scheduled follow-up due by ${context.now.slice(0, 10)}:\n${list(due.map(item => `${item.title} at ${item.company} (${item.status})`))}` : 'No applications have a scheduled follow-up due today or earlier. I cannot infer a follow-up date that is not recorded.', due.map(item => evidence('application', item.id, `${item.title} at ${item.company}`, `Follow-up date: ${item.followUpDate}; status: ${item.status}`)));
    }
    if (/active|pipeline|currently open/.test(lower)) {
      return this.result('active_applications', active.length ? `Active applications (${active.length}):\n${list(active.map(item => `${item.title} at ${item.company} — ${item.status}`))}` : 'There are no active applications in the recorded application data.', active.map(item => evidence('application', item.id, `${item.title} at ${item.company}`, `Status: ${item.status}`)));
    }
    if (/interview|prepare/.test(lower)) {
      const match = this.findApplication(question, context.applications);
      const prep = match ? context.interviews.find(item => item.applicationId === match.id) : undefined;
      if (!match) return this.result('interview_preparation', 'I could not identify a matching application from your question. Select an application in Interview Prep to see its saved preparation.', []);
      if (!prep) return this.result('interview_preparation', `No interview preparation is saved for ${match.title} at ${match.company}. Generate it from the Interview Prep workspace; I will not invent likely questions.`, [evidence('application', match.id, `${match.title} at ${match.company}`, `Interview date: ${match.interviewDate ?? 'not recorded'}`)]);
      return this.result('interview_preparation', `Saved preparation for ${match.title} at ${match.company} (${prep.stage}):\nTopics: ${prep.topics.join(', ') || 'none recorded'}\nChecklist:\n${list(prep.checklist)}`, [evidence('application', match.id, `${match.title} at ${match.company}`, `Interview stage: ${prep.stage}`), evidence('interview', match.id, 'Saved interview preparation', `Topics: ${prep.topics.join(', ') || 'none recorded'}`)]);
    }
    if (/resume/.test(lower)) {
      const match = this.findApplication(question, context.applications);
      if (match?.resumeTitle) return this.result('resume_selection', `The recorded application uses “${match.resumeTitle}” version ${match.resumeVersion ?? 'unknown'}. That is the only resume selection I can confirm for ${match.title} at ${match.company}.`, [evidence('application', match.id, `${match.title} at ${match.company}`, `Resume: ${match.resumeTitle} v${match.resumeVersion ?? 'unknown'}`)]);
      if (context.resumes.length) return this.result('resume_selection', match ? `No resume version is recorded for ${match.title} at ${match.company}. Available resumes are:\n${list(context.resumes.map(resume => `${resume.title}${resume.version ? ` v${resume.version}` : ''}`))}` : `I could not identify a target application. Available resumes are:\n${list(context.resumes.map(resume => `${resume.title}${resume.version ? ` v${resume.version}` : ''}`))}`, context.resumes.map(item => evidence('resume', item.id, item.title, `Latest version: ${item.version ?? 'not available'}`)));
      return this.result('resume_selection', 'No resumes are recorded in your workspace, so I cannot recommend one.', []);
    }
    if (/repeated|common|appear.*job|skill/.test(lower) && !/improve|gap/.test(lower)) {
      const counts = new Map<string, number>(); const labels = new Map<string, string>();
      for (const job of context.jobs) for (const skill of [...job.skills, ...terms(job.description)]) { const key = normalized(skill); if (key.length < 3) continue; counts.set(key, (counts.get(key) ?? 0) + 1); labels.set(key, skill); }
      const repeated = [...counts.entries()].filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1]).slice(0, 12);
      return this.result('repeated_skills', repeated.length ? `Terms appearing in more than one recorded target job:\n${list(repeated.map(([key, count]) => `${labels.get(key) ?? key} (${count} jobs)`))}` : 'No skill or keyword appears in more than one recorded target job.', context.jobs.slice(0, 20).map(job => evidence('job', job.id, `${job.title} at ${job.company}`, `Recorded skills: ${job.skills.join(', ') || 'none'}`)));
    }
    if (/align|match|fit|suit/.test(lower)) {
      const profileText = `${context.profile.headline} ${context.profile.summary} ${context.profile.targetRoles.join(' ')} ${context.profile.skills.join(' ')}`.toLowerCase();
      const aligned = context.jobs.map(job => ({ job, matches: [...new Set([...job.skills, ...terms(job.description)].filter(term => profileText.includes(normalized(term))))] })).filter(item => item.matches.length).sort((a, b) => b.matches.length - a.matches.length);
      return this.result('job_alignment', aligned.length ? `Recorded jobs with profile term overlap (not a hiring prediction):\n${list(aligned.map(item => `${item.job.title} at ${item.job.company} — ${item.matches.slice(0, 8).join(', ')}`))}` : 'No recorded jobs share terms with the current profile data. This is not a rejection prediction; it only means no overlap was found.', aligned.slice(0, 10).map(item => evidence('job', item.job.id, `${item.job.title} at ${item.job.company}`, `Overlapping profile terms: ${item.matches.join(', ')}`)));
    }
    if (/improve|gap|weak|missing/.test(lower)) {
      const profileText = `${context.profile.headline} ${context.profile.summary} ${context.profile.targetRoles.join(' ')} ${context.profile.skills.join(' ')}`.toLowerCase();
      const gaps = context.jobs.flatMap(job => [...new Set([...job.skills, ...terms(job.description)].filter(term => !profileText.includes(normalized(term))))]);
      const unique = [...new Set(gaps)].slice(0, 15);
      return this.result('improvement_areas', unique.length ? `Areas to review against recorded target jobs (not claims that you lack these skills):\n${list(unique)}` : 'No unrepresented terms were found in the recorded target jobs compared with your profile text.', context.jobs.slice(0, 10).map(job => evidence('job', job.id, `${job.title} at ${job.company}`, 'Compared with current profile text')));
    }
    return this.result('workspace_summary', `I can answer from your recorded data. You currently have ${context.jobs.length} jobs, ${context.applications.length} applications (${active.length} active), and ${context.resumes.length} resumes. Try asking about follow-ups, alignment, repeated skills, resume selection, interview preparation, improvement areas, or active applications.`, []);
  }
  private result(intent: string, answer: string, evidenceItems: AssistantEvidence[]) { return assistantAnswerSchema.parse({ provider: this.name, intent, answer, evidence: evidenceItems }); }
  private findApplication(question: string, applications: AssistantApplication[]) { const lower = question.toLowerCase(); return applications.find(item => lower.includes(item.company.toLowerCase()) || lower.includes(item.title.toLowerCase())); }
}
export function createCareerAssistantProvider(): CareerAssistantProvider { return new SafeMockCareerAssistantProvider(); }
