import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const navigationItems = [
  { label: 'Dashboard', path: '/', icon: 'layout-dashboard' },
  { label: 'Profile', path: '/profile', icon: 'user-round' },
  { label: 'Resume', path: '/resume', icon: 'file-text' },
  { label: 'Jobs', path: '/jobs', icon: 'briefcase-business' },
  { label: 'Applications', path: '/applications', icon: 'kanban' },
  { label: 'Application package', path: '/application-package', icon: 'package-check' },
  { label: 'Interview prep', path: '/interview-preparation', icon: 'message-circle-question' },
  { label: 'Career assistant', path: '/career-assistant', icon: 'bot' },
  { label: 'Content studio', path: '/content-studio', icon: 'pen-line' },
  { label: 'Settings', path: '/settings', icon: 'settings' },
] as const;

export type NavigationItem = (typeof navigationItems)[number];

export const remotePreferenceSchema = z.enum(['onsite', 'hybrid', 'remote', 'flexible']);
export const dateSchema = z.string().datetime({ offset: true });

const optionalText = (max: number) => z.string().trim().max(max).default('');

export const profileDetailsSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: optionalText(80),
  professionalTitle: z.string().trim().min(1, 'Professional title is required').max(120),
  location: optionalText(120),
  phone: optionalText(40),
  website: z.union([z.string().trim().url('Enter a valid URL'), z.literal('')]).default(''),
  summary: optionalText(2000),
  yearsOfExperience: z.number().int().min(0).max(80),
  targetRoles: z.array(z.string().trim().min(1).max(120)).max(20),
  preferredLocations: z.array(z.string().trim().min(1).max(120)).max(20),
  remotePreference: remotePreferenceSchema,
});

export const experienceSchema = z.object({
  company: z.string().trim().min(1, 'Company is required').max(160),
  title: z.string().trim().min(1, 'Title is required').max(160),
  startDate: dateSchema,
  endDate: dateSchema.nullable().default(null),
  description: optionalText(3000),
});

export const educationSchema = z.object({
  institution: z.string().trim().min(1, 'Institution is required').max(200),
  degree: z.string().trim().min(1, 'Degree is required').max(160),
  field: optionalText(160),
  startDate: dateSchema,
  endDate: dateSchema.nullable().default(null),
});

export const projectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(160),
  description: optionalText(3000),
  url: z.union([z.string().trim().url('Enter a valid URL'), z.literal('')]).default(''),
});

export const skillSchema = z.object({
  name: z.string().trim().min(1, 'Skill is required').max(120),
  level: optionalText(40),
  technology: z.boolean().default(false),
});

export const certificationSchema = z.object({
  name: z.string().trim().min(1, 'Certification name is required').max(200),
  issuer: optionalText(200),
  issuedAt: dateSchema.nullable().default(null),
});

export const achievementSchema = z.object({
  title: z.string().trim().min(1, 'Achievement is required').max(200),
  description: optionalText(2000),
});

export type ProfileDetails = z.infer<typeof profileDetailsSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type SkillInput = z.infer<typeof skillSchema>;
export type CertificationInput = z.infer<typeof certificationSchema>;
export type AchievementInput = z.infer<typeof achievementSchema>;

export const resumeSectionIds = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'achievements'] as const;
export const resumeSectionSchema = z.enum(resumeSectionIds);
export type ResumeSectionId = (typeof resumeSectionIds)[number];

export const resumeDocumentSchema = z.object({
  summary: z.string().trim().max(3000).default(''),
  sectionOrder: z.array(resumeSectionSchema).length(resumeSectionIds.length),
  visibleSections: z.record(resumeSectionSchema, z.boolean()),
  experienceIds: z.array(z.string().trim()),
  educationIds: z.array(z.string().trim()),
  skillIds: z.array(z.string().trim()),
  projectIds: z.array(z.string().trim()),
  certificationIds: z.array(z.string().trim()),
  achievementIds: z.array(z.string().trim()),
  acceptedSuggestionIds: z.array(z.string().trim()).default([]),
});

export const resumeCreateSchema = z.object({ title: z.string().trim().min(1, 'Resume name is required').max(120) });
export const resumeSaveSchema = z.object({ title: z.string().trim().min(1, 'Resume name is required').max(120), content: resumeDocumentSchema });
export type ResumeDocument = z.infer<typeof resumeDocumentSchema>;
export type ResumeCreateInput = z.infer<typeof resumeCreateSchema>;
export type ResumeSaveInput = z.infer<typeof resumeSaveSchema>;

export const remoteStatusSchema = z.enum(['onsite', 'hybrid', 'remote', 'flexible']);
export const jobPrioritySchema = z.enum(['low', 'medium', 'high']);
export const applicationStatusSchema = z.enum(['Saved', 'Applied', 'Screening', 'Interview', 'Technical Interview', 'HR', 'Offer', 'Rejected', 'Withdrawn']);
export const jobSchema = z.object({
  title: z.string().trim().min(1, 'Job title is required').max(160), company: z.string().trim().min(1, 'Company is required').max(160),
  location: optionalText(160), remoteStatus: remoteStatusSchema, description: optionalText(20000), skills: z.array(z.string().trim().min(1).max(120)).max(50), experience: optionalText(160),
  salaryMin: z.number().nonnegative().nullable().default(null), salaryMax: z.number().nonnegative().nullable().default(null), salaryCurrency: optionalText(8), source: optionalText(120), applicationUrl: z.union([z.string().trim().url('Enter a valid URL'), z.literal('')]).default(''), postedDate: dateSchema.nullable().default(null),
});
export const savedJobSchema = z.object({ notes: optionalText(3000), priority: jobPrioritySchema.default('medium') });
export const applicationCreateSchema = z.object({ jobId: z.string().trim().min(1), status: applicationStatusSchema.default('Saved'), appliedAt: dateSchema.nullable().default(null), resumeVersionId: z.string().trim().nullable().default(null), coverLetter: optionalText(12000), notes: optionalText(5000), interviewDate: dateSchema.nullable().default(null), followUpDate: dateSchema.nullable().default(null) });
export const applicationUpdateSchema = applicationCreateSchema.partial().extend({ status: applicationStatusSchema.optional() });
export type JobInput = z.infer<typeof jobSchema>;
export type SavedJobInput = z.infer<typeof savedJobSchema>;
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;
export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>;

export const optimizationCategorySchema = z.enum(['keyword_alignment', 'missing_skill', 'bullet_improvement', 'measurable_achievement', 'summary', 'ats', 'irrelevant_content']);
export const optimizationSuggestionStatusSchema = z.enum(['pending', 'accepted', 'rejected']);
export const optimizationSuggestionSchema = z.object({
  id: z.string().min(1),
  category: optimizationCategorySchema,
  title: z.string().min(1).max(200),
  rationale: z.string().min(1).max(1000),
  suggestedText: z.string().min(1).max(2000),
  evidenceTerms: z.array(z.string().min(1)).max(20),
  sourceFactIds: z.array(z.string().min(1)).max(20),
  factStatus: z.literal('suggestion'),
  status: optimizationSuggestionStatusSchema,
});
export const optimizationRequestSchema = z.object({ jobDescription: z.string().trim().min(40, 'Add a fuller job description to optimize against.').max(20000) });
export const optimizationResultSchema = z.object({
  provider: z.string().min(1),
  keywordAlignment: z.object({ matched: z.array(z.string()), missing: z.array(z.string()) }),
  atsConsiderations: z.array(z.string()),
  suggestions: z.array(optimizationSuggestionSchema),
});
export type OptimizationSuggestion = z.infer<typeof optimizationSuggestionSchema>;
export type OptimizationResult = z.infer<typeof optimizationResultSchema>;

export const coverLetterRequestSchema = z.object({
  resumeId: z.string().trim().min(1, 'Select a resume.'),
  jobDescription: z.string().trim().min(40, 'Add a fuller job description.').max(20000),
  company: z.string().trim().min(1, 'Company is required.').max(160),
  role: z.string().trim().min(1, 'Role is required.').max(160),
});
export const coverLetterUpdateSchema = z.object({ content: z.string().trim().min(80, 'Cover letter is too short.').max(12000) });
export const coverLetterResultSchema = z.object({
  provider: z.string().min(1), content: z.string().min(1).max(12000), sourceFactIds: z.array(z.string()), factStatus: z.literal('derived_from_user_facts'),
});
export type CoverLetterRequest = z.infer<typeof coverLetterRequestSchema>;
export type CoverLetterResult = z.infer<typeof coverLetterResultSchema>;
export const applicationPackageRequestSchema = coverLetterRequestSchema.extend({ jobId: z.string().trim().min(1).nullable().default(null) });
export const applicationPackageSchema = z.object({
  resume: z.object({ id: z.string(), title: z.string(), versionId: z.string(), version: z.number(), content: resumeDocumentSchema }),
  coverLetterId: z.string(),
  coverLetter: coverLetterResultSchema,
  skillsMatch: z.array(z.string()), skillsGap: z.array(z.string()),
  interviewPreparation: z.array(z.object({ question: z.string(), preparation: z.string(), sourceFactIds: z.array(z.string()) })),
  checklist: z.array(z.string()),
});
export type ApplicationPackageRequest = z.infer<typeof applicationPackageRequestSchema>;
export type ApplicationPackage = z.infer<typeof applicationPackageSchema>;

export const interviewStageSchema = z.enum(['Recruiter Screen', 'Technical Interview', 'Behavioral Interview', 'System Design', 'Onsite', 'Final Interview']);
export const interviewAnswerSchema = z.object({ questionId: z.string().min(1), answer: z.string().max(5000) });
export const interviewPreparationRequestSchema = z.object({
  stage: interviewStageSchema.default('Technical Interview'),
  scheduledAt: dateSchema.nullable().default(null),
  notes: z.string().trim().max(5000).default(''),
});
export const interviewPreparationUpdateSchema = interviewPreparationRequestSchema.partial().extend({ answers: z.array(interviewAnswerSchema).max(50).optional() });
export const interviewPreparationSchema = z.object({
  materialType: z.literal('preparation_material'),
  disclaimer: z.string().min(1),
  technicalTopics: z.array(z.string()),
  likelyTopicCategories: z.array(z.string()),
  resumeQuestions: z.array(z.object({ id: z.string(), question: z.string(), sourceFactIds: z.array(z.string()) })),
  behavioralQuestions: z.array(z.object({ id: z.string(), question: z.string(), sourceFactIds: z.array(z.string()) })),
  roleSpecificQuestions: z.array(z.object({ id: z.string(), question: z.string(), sourceFactIds: z.array(z.string()) })),
  checklist: z.array(z.string()),
});
export const interviewPreparationResponseSchema = z.object({
  id: z.string(), applicationId: z.string(), stage: interviewStageSchema, scheduledAt: dateSchema.nullable(), notes: z.string(), answers: z.array(interviewAnswerSchema), preparation: interviewPreparationSchema, createdAt: dateSchema, updatedAt: dateSchema,
});
export type InterviewStage = z.infer<typeof interviewStageSchema>;
export type InterviewPreparationRequest = z.infer<typeof interviewPreparationRequestSchema>;
export type InterviewPreparationUpdate = z.infer<typeof interviewPreparationUpdateSchema>;
export type InterviewPreparation = z.infer<typeof interviewPreparationSchema>;
export type InterviewPreparationResponse = z.infer<typeof interviewPreparationResponseSchema>;

export const assistantEvidenceSchema = z.object({ type: z.enum(['profile', 'job', 'application', 'resume', 'interview']), id: z.string(), label: z.string(), detail: z.string() });
export const assistantAnswerSchema = z.object({ provider: z.string(), intent: z.string(), answer: z.string().min(1).max(12000), evidence: z.array(assistantEvidenceSchema).max(50) });
export const assistantMessageSchema = z.object({ id: z.string(), role: z.enum(['user', 'assistant']), content: z.string(), evidence: z.array(assistantEvidenceSchema).default([]), createdAt: z.string().datetime({ offset: true }) });
export const assistantAskSchema = z.object({ question: z.string().trim().min(2, 'Ask a question.').max(2000), conversationId: z.string().trim().min(1).nullable().default(null) });
export const assistantConversationSchema = z.object({ id: z.string(), title: z.string().nullable(), messages: z.array(assistantMessageSchema), createdAt: z.string().datetime({ offset: true }), updatedAt: z.string().datetime({ offset: true }) });
export type AssistantEvidence = z.infer<typeof assistantEvidenceSchema>;
export type AssistantAnswer = z.infer<typeof assistantAnswerSchema>;
export type AssistantMessage = z.infer<typeof assistantMessageSchema>;
export type AssistantAsk = z.infer<typeof assistantAskSchema>;
export type AssistantConversation = z.infer<typeof assistantConversationSchema>;

export const contentStatusSchema = z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'PUBLISH_FAILED']);
export const contentIdeaStatusSchema = z.enum(['BACKLOG', 'PLANNED', 'USED']);
export const contentStrategySchema = z.object({ targetAudience: z.string().trim().max(500), writingVoice: z.string().trim().max(500), postingFrequency: z.string().trim().max(120), recurringThemes: z.array(z.string().trim().min(1).max(120)).max(20) });
export const contentPillarSchema = z.object({ name: z.string().trim().min(1).max(120), description: z.string().trim().max(500).default('') });
export const contentIdeaSchema = z.object({ title: z.string().trim().min(1).max(180), prompt: z.string().trim().min(10).max(1000), pillarId: z.string().trim().nullable().default(null), status: contentIdeaStatusSchema.default('BACKLOG') });
export const contentDraftCreateSchema = z.object({ title: z.string().trim().min(1).max(180), topic: z.string().trim().min(1).max(300), body: z.string().trim().max(3000).default(''), sourceIdeaId: z.string().trim().nullable().default(null) });
export const contentDraftUpdateSchema = contentDraftCreateSchema.partial().extend({ body: z.string().trim().min(1).max(3000).optional(), status: contentStatusSchema.optional(), scheduledAt: dateSchema.nullable().optional() });
export const contentGenerationRequestSchema = z.object({ topic: z.string().trim().min(10).max(500), title: z.string().trim().min(1).max(180).default('LinkedIn draft'), sourceIdeaId: z.string().trim().nullable().default(null) });
export const contentTransformSchema = z.object({ action: z.enum(['rewrite', 'improve_hook', 'shorten', 'expand', 'regenerate']) });
export const contentCritiqueSchema = z.object({ provider: z.string(), summary: z.string(), strengths: z.array(z.string()), improvements: z.array(z.string()), factStatus: z.literal('critique_only') });
export const contentDraftSchema = z.object({ id: z.string(), title: z.string(), topic: z.string(), body: z.string(), status: contentStatusSchema, sourceFactIds: z.array(z.string()), sourceIdeaId: z.string().nullable(), failureReason: z.string().nullable(), reviewedAt: dateSchema.nullable(), approvedAt: dateSchema.nullable(), scheduledAt: dateSchema.nullable(), publishedAt: dateSchema.nullable(), createdAt: dateSchema, updatedAt: dateSchema, revisions: z.array(z.object({ id: z.string(), version: z.number(), body: z.string(), changeType: z.string(), createdAt: dateSchema })), critiques: z.array(contentCritiqueSchema) });
export type ContentStatus = z.infer<typeof contentStatusSchema>;
export type ContentStrategy = z.infer<typeof contentStrategySchema>;
export type ContentIdeaInput = z.infer<typeof contentIdeaSchema>;
export type ContentDraft = z.infer<typeof contentDraftSchema>;
export type ContentCritique = z.infer<typeof contentCritiqueSchema>;
