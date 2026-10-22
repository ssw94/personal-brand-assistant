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
  { label: 'Content Studio', path: '/content', icon: 'pen-line' },
  { label: 'Ideas', path: '/content/ideas', icon: 'lightbulb' },
  { label: 'Content Calendar', path: '/content/calendar', icon: 'calendar-days' },
  { label: 'Drafts', path: '/content/drafts', icon: 'file-edit' },
  { label: 'Scheduled', path: '/content/scheduled', icon: 'clock-3' },
  { label: 'Published', path: '/content/published', icon: 'send' },
  { label: 'Content Strategy', path: '/content/strategy', icon: 'target' },
  { label: 'LinkedIn Connection', path: '/linkedin', icon: 'linkedin' },
  { label: 'Publishing History', path: '/linkedin/history', icon: 'history' },
  { label: 'Billing', path: '/billing', icon: 'credit-card' },
  { label: 'Settings', path: '/settings', icon: 'settings' },
] as const;

export type NavigationItem = (typeof navigationItems)[number];

export const planCatalog = [
  { id: 'FREE', name: 'Free', price: 0, currency: 'INR', period: 'month', monthlyPostLimit: 3, description: 'A focused starting point for building your professional foundation.', features: ['Professional profile', '3 posts per month'], aiUsage: 'Limited', publishing: 'Not included', scheduling: 'Not included', team: false },
  { id: 'CREATOR', name: 'Creator', price: 499, currency: 'INR', period: 'month', monthlyPostLimit: 15, description: 'For professionals building a consistent, thoughtful presence.', features: ['Everything in Free', '15 posts per month'], aiUsage: 'Included', publishing: 'Provider-dependent', scheduling: 'Included', team: false },
  { id: 'PRO', name: 'Pro', price: 999, currency: 'INR', period: 'month', monthlyPostLimit: 30, description: 'For an active personal brand and career workflow.', features: ['Everything in Creator', '30 posts per month'], aiUsage: 'Included', publishing: 'Provider-dependent', scheduling: 'Included', team: false },
  { id: 'EXPERT', name: 'Expert', price: 1999, currency: 'INR', period: 'month', monthlyPostLimit: 60, description: 'For professionals who want the most room to work with AI.', features: ['Everything in Pro', '60 posts per month'], aiUsage: 'Included', publishing: 'Provider-dependent', scheduling: 'Included', team: false },
  { id: 'TEAM', name: 'Team', price: null, currency: 'INR', period: 'month', monthlyPostLimit: null, description: 'For teams with custom usage requirements.', features: ['Everything in Pro', 'Custom usage'], aiUsage: 'Custom', publishing: 'Provider-dependent', scheduling: 'Included', team: true },
] as const;
export type PlanId = (typeof planCatalog)[number]['id'];

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

export const contentStatusSchema = z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'PUBLISH_FAILED', 'ARCHIVED']);
export const contentLifecycleStateSchema = z.enum(['IDEA', 'DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']);
export const idSchema = z.string().trim().min(1).max(200);
export const ownershipRefSchema = z.object({ userId: idSchema });
export const approvalDecisionSchema = z.enum(['APPROVED', 'REJECTED', 'REQUEST_CHANGES']);
export const approvalAuditSchema = z.object({ ownerUserId: idSchema, actorUserId: idSchema, draftId: idSchema, revisionId: idSchema, decision: approvalDecisionSchema, reason: z.string().trim().max(2000).nullable().default(null), correlationId: idSchema.nullable().default(null) });
const sensitiveAuditKey = /(token|secret|password|authorization|credential|private.?key|api.?key)/i;
function findSensitiveAuditKey(value: unknown, path: string[] = []): string[] | null {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) { const found = findSensitiveAuditKey(item, [...path, String(index)]); if (found) return found; }
    return null;
  }
  for (const [key, item] of Object.entries(value)) {
    if (sensitiveAuditKey.test(key)) return [...path, key];
    const found = findSensitiveAuditKey(item, [...path, key]);
    if (found) return found;
  }
  return null;
}
export const auditMetadataSchema = z.record(z.string().trim().min(1).max(80), z.unknown()).nullable().default(null).superRefine((metadata, ctx) => {
  if (metadata === null) return;
  const sensitivePath = findSensitiveAuditKey(metadata);
  if (sensitivePath) ctx.addIssue({ code: z.ZodIssueCode.custom, path: sensitivePath, message: 'Sensitive credentials must not be written to audit metadata.' });
  let serialized: string;
  try { serialized = JSON.stringify(metadata); } catch { ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Audit metadata must be JSON serializable.' }); return; }
  if (serialized.length > 16_384) ctx.addIssue({ code: z.ZodIssueCode.too_big, maximum: 16_384, type: 'string', inclusive: true, message: 'Audit metadata is too large.' });
});
export const auditEventSchema = z.object({ ownerUserId: idSchema, actorUserId: idSchema, resourceType: z.string().trim().min(1).max(80), resourceId: idSchema, action: z.string().trim().min(1).max(120), result: z.string().trim().min(1).max(80), reason: z.string().trim().max(2000).nullable().default(null), metadata: auditMetadataSchema, correlationId: idSchema.nullable().default(null) });
export const idempotencyKeySchema = z.string().trim().min(8).max(200);
export const idempotencyRequestSchema = z.object({ key: idempotencyKeySchema, operation: z.string().trim().min(1).max(120), payload: z.unknown() });
export const idempotencyRecordSchema = z.object({ id: idSchema, userId: idSchema, key: idempotencyKeySchema, operation: z.string(), requestHash: z.string().length(64), status: z.enum(['IN_PROGRESS', 'COMPLETED', 'FAILED']), responseStatus: z.number().int().nullable(), responseBody: z.unknown().nullable(), resourceId: idSchema.nullable(), errorCode: z.string().nullable(), createdAt: dateSchema, updatedAt: dateSchema, expiresAt: dateSchema.nullable() });
export const apiErrorSchema = z.object({ error: z.string(), code: z.string().optional(), requestId: z.string().optional() });
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
export type ContentLifecycleState = z.infer<typeof contentLifecycleStateSchema>;
export type ApprovalDecision = z.infer<typeof approvalDecisionSchema>;
export type ApprovalAudit = z.infer<typeof approvalAuditSchema>;
export type AuditEvent = z.infer<typeof auditEventSchema>;
export type IdempotencyRequest = z.infer<typeof idempotencyRequestSchema>;
export type IdempotencyRecord = z.infer<typeof idempotencyRecordSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type ContentStrategy = z.infer<typeof contentStrategySchema>;
export type ContentIdeaInput = z.infer<typeof contentIdeaSchema>;
export type ContentDraft = z.infer<typeof contentDraftSchema>;
export type ContentCritique = z.infer<typeof contentCritiqueSchema>;

export const memoryFactTypeSchema = z.enum(['SUMMARY', 'EXPERIENCE', 'EDUCATION', 'SKILL', 'PROJECT', 'CERTIFICATION', 'ACHIEVEMENT', 'PREFERENCE', 'OTHER']);
export const memoryReviewStateSchema = z.enum(['CANDIDATE', 'VERIFIED', 'REJECTED', 'SUPERSEDED']);
export const memorySourceTypeSchema = z.enum(['PROFILE', 'RESUME', 'PROJECT', 'USER_ENTERED', 'IMPORTED_DOCUMENT', 'AI_EXTRACTED_CANDIDATE']);
export const styleExampleSourceTypeSchema = z.enum(['USER_ENTERED', 'CONTENT_DRAFT', 'IMPORTED_DOCUMENT']);
export const memorySourceSchema = z.object({ id: idSchema, sourceType: memorySourceTypeSchema, sourceRef: idSchema.nullable(), sourceDocumentId: idSchema.nullable(), sourceLabel: z.string().nullable(), createdAt: dateSchema }).strict();
export const memoryFactSchema = z.object({ id: idSchema, factType: memoryFactTypeSchema, category: z.string().min(1).max(120), normalizedValue: z.string().min(1).max(4000), canonicalKey: z.string().nullable(), confidence: z.number().min(0).max(1).nullable(), reviewState: memoryReviewStateSchema, version: z.number().int().positive(), verifiedAt: dateSchema.nullable(), rejectedAt: dateSchema.nullable(), supersededAt: dateSchema.nullable(), createdAt: dateSchema, updatedAt: dateSchema, sources: z.array(memorySourceSchema) }).strict();
export const memoryFactVersionSchema = z.object({ id: idSchema, version: z.number().int().positive(), factType: memoryFactTypeSchema, category: z.string(), normalizedValue: z.string(), confidence: z.number().min(0).max(1).nullable(), reviewState: memoryReviewStateSchema, changeReason: z.string().nullable(), changedByUserId: idSchema.nullable(), createdAt: dateSchema }).strict();
export const memoryFactCreateSchema = z.object({ factType: memoryFactTypeSchema, category: z.string().trim().min(1).max(120), normalizedValue: z.string().trim().min(1).max(4000), confidence: z.number().min(0).max(1).nullable().default(null), canonicalKey: z.string().trim().max(200).nullable().default(null) }).strict();
export const memoryFactUpdateSchema = memoryFactCreateSchema.partial().strict();
export const memoryReviewSchema = z.object({ decision: z.enum(['VERIFIED', 'REJECTED', 'SUPERSEDED']), reason: z.string().trim().max(1000).nullable().default(null) }).strict();
export const memoryContextItemSchema = z.object({ id: idSchema, factType: memoryFactTypeSchema, category: z.string(), normalizedValue: z.string(), confidence: z.number().min(0).max(1).nullable(), reviewState: memoryReviewStateSchema, sources: z.array(memorySourceSchema) }).strict();
export const memoryContextSchema = z.object({ facts: z.array(memoryContextItemSchema).max(100) }).strict();
export const memoryCandidateSchema = z.object({ factType: memoryFactTypeSchema, category: z.string().min(1).max(120), normalizedValue: z.string().min(1).max(4000), confidence: z.number().min(0).max(1) }).strict();
export const memoryExtractionResultSchema = z.object({ candidates: z.array(memoryCandidateSchema).max(50) }).strict();
export type MemoryFactType = z.infer<typeof memoryFactTypeSchema>;
export type MemoryReviewState = z.infer<typeof memoryReviewStateSchema>;
export type MemorySourceType = z.infer<typeof memorySourceTypeSchema>;
export type MemoryFact = z.infer<typeof memoryFactSchema>;
export type MemoryFactVersion = z.infer<typeof memoryFactVersionSchema>;
export type MemoryFactCreate = z.infer<typeof memoryFactCreateSchema>;
export type MemoryFactUpdate = z.infer<typeof memoryFactUpdateSchema>;
export type MemoryReview = z.infer<typeof memoryReviewSchema>;
export type MemoryContext = z.infer<typeof memoryContextSchema>;
export type MemoryCandidate = z.infer<typeof memoryCandidateSchema>;

export const writingStyleProfileSchema = z.object({ id: idSchema, tone: z.string().nullable(), sentenceStyle: z.string().nullable(), technicalDepth: z.string().nullable(), storytellingPreference: z.string().nullable(), hookStyle: z.string().nullable(), formattingPreference: z.string().nullable(), emojiUsage: z.string().nullable(), ctaPreference: z.string().nullable(), opinionStrength: z.string().nullable(), firstPersonUsage: z.string().nullable(), typicalLength: z.string().nullable(), explicitPreferences: z.record(z.string()).nullable(), reviewState: memoryReviewStateSchema, analysisRunId: idSchema.nullable(), analyzedExampleIds: z.array(idSchema), analyzedAt: dateSchema.nullable(), createdAt: dateSchema, updatedAt: dateSchema }).strict();
export const writingStyleUpdateSchema = writingStyleProfileSchema.pick({ tone: true, sentenceStyle: true, technicalDepth: true, storytellingPreference: true, hookStyle: true, formattingPreference: true, emojiUsage: true, ctaPreference: true, opinionStrength: true, firstPersonUsage: true, typicalLength: true, explicitPreferences: true }).partial().strict();
export const writingStyleExampleSchema = z.object({ id: idSchema, content: z.string().min(1).max(12000), sourceType: styleExampleSourceTypeSchema, sourceRef: idSchema.nullable(), includedInAnalysis: z.boolean(), createdAt: dateSchema, updatedAt: dateSchema }).strict();
export const writingStyleExampleCreateSchema = z.object({ content: z.string().trim().min(40).max(12000), sourceType: z.literal('USER_ENTERED'), sourceRef: z.string().trim().max(200).nullable().default(null), includedInAnalysis: z.boolean().default(true) }).strict();
export const writingStyleExampleUpdateSchema = z.object({ content: z.string().trim().min(40).max(12000).optional(), includedInAnalysis: z.boolean().optional() }).strict();
export const styleAnalysisRequestSchema = z.object({ exampleIds: z.array(idSchema).min(1).max(20) }).strict();
export const styleAnalysisResultSchema = z.object({ tone: z.string().max(500), sentenceStyle: z.string().max(500), technicalDepth: z.string().max(500), storytellingPreference: z.string().max(500), hookStyle: z.string().max(500), formattingPreference: z.string().max(500), emojiUsage: z.string().max(500), ctaPreference: z.string().max(500), opinionStrength: z.string().max(500), firstPersonUsage: z.string().max(500), typicalLength: z.string().max(200), explicitPreferences: z.record(z.string()) }).strict();
export type WritingStyleProfile = z.infer<typeof writingStyleProfileSchema>;
export type WritingStyleUpdate = z.infer<typeof writingStyleUpdateSchema>;
export type WritingStyleExample = z.infer<typeof writingStyleExampleSchema>;
export type WritingStyleExampleCreate = z.infer<typeof writingStyleExampleCreateSchema>;
export type WritingStyleExampleUpdate = z.infer<typeof writingStyleExampleUpdateSchema>;
export type StyleAnalysisRequest = z.infer<typeof styleAnalysisRequestSchema>;
export type StyleAnalysisResult = z.infer<typeof styleAnalysisResultSchema>;

export const researchRunStatusSchema = z.enum(['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'UNAVAILABLE']);
export const researchSourceSafetySchema = z.enum(['UNCLASSIFIED', 'SAFE_DATA', 'PROMPT_INJECTION_SUSPECTED', 'BLOCKED']);
export const researchCitationSchema = z.object({ id: idSchema, sourceId: idSchema, claim: z.string().min(1).max(2000), quote: z.string().max(1000).nullable(), locator: z.string().max(500).nullable(), createdAt: dateSchema }).strict();
export const researchSourceSchema = z.object({ id: idSchema, runId: idSchema, url: z.string().url(), title: z.string().nullable(), contentHash: z.string().length(64), fetchedAt: dateSchema.nullable(), freshnessUntil: dateSchema.nullable(), safety: researchSourceSafetySchema, citations: z.array(researchCitationSchema).max(100), createdAt: dateSchema }).strict();
export const researchRunSchema = z.object({ id: idSchema, query: z.string().min(1).max(500), status: researchRunStatusSchema, provider: z.string().min(1).max(80), failureReason: z.string().nullable(), createdAt: dateSchema, completedAt: dateSchema.nullable(), updatedAt: dateSchema, sources: z.array(researchSourceSchema).max(50) }).strict();
export const researchRequestSchema = z.object({ query: z.string().trim().min(3).max(500), urls: z.array(z.string().url()).max(10).default([]) }).strict();
export const researchCitationInputSchema = z.object({ claim: z.string().trim().min(1).max(2000), quote: z.string().trim().max(1000).nullable().default(null), locator: z.string().trim().max(500).nullable().default(null) }).strict();
export const researchResultSchema = z.object({ title: z.string().max(300).nullable(), content: z.string().max(20000), citations: z.array(researchCitationInputSchema).max(100) }).strict();
export type ResearchRunStatus = z.infer<typeof researchRunStatusSchema>;
export type ResearchSourceSafety = z.infer<typeof researchSourceSafetySchema>;
export type ResearchRequest = z.infer<typeof researchRequestSchema>;
export type ResearchRun = z.infer<typeof researchRunSchema>;

export const usageReservationStatusSchema = z.enum(['RESERVED', 'CONSUMED', 'RELEASED', 'EXPIRED']);
export const usageSummarySchema = z.object({ plan: z.string(), periodStart: dateSchema, periodEnd: dateSchema, limit: z.number().int().nonnegative().nullable(), reserved: z.number().int().nonnegative(), consumed: z.number().int().nonnegative(), remaining: z.number().int().nonnegative().nullable() }).strict();
export const usageReservationSchema = z.object({ id: idSchema, operation: z.string(), quantity: z.number().int().positive(), status: usageReservationStatusSchema, createdAt: dateSchema }).strict();
export type UsageSummary = z.infer<typeof usageSummarySchema>;

export const topicCandidateStatusSchema = z.enum(['CANDIDATE', 'SELECTED', 'REJECTED', 'EXPIRED']);
export const topicCandidateSchema = z.object({ id: idSchema, title: z.string().min(1).max(240), angle: z.string().min(1).max(1000), rationale: z.string().min(1).max(2000), noveltyKey: z.string().min(1).max(240), memoryFactIds: z.array(idSchema).max(50), researchSourceIds: z.array(idSchema).max(50), status: topicCandidateStatusSchema, reviewedAt: dateSchema.nullable(), createdAt: dateSchema, updatedAt: dateSchema }).strict();
export const topicGenerationRequestSchema = z.object({ count: z.number().int().min(1).max(10).default(5), focus: z.string().trim().max(500).default('') }).strict();
export const topicGenerationResultSchema = z.object({ candidates: z.array(z.object({ title: z.string().trim().min(1).max(240), angle: z.string().trim().min(1).max(1000), rationale: z.string().trim().min(1).max(2000), noveltyKey: z.string().trim().min(1).max(240), memoryFactIds: z.array(idSchema).max(50), researchSourceIds: z.array(idSchema).max(50) }).strict()).max(10) }).strict();
export const topicReviewSchema = z.object({ decision: z.enum(['SELECTED', 'REJECTED']), reason: z.string().trim().max(1000).nullable().default(null) }).strict();
export type TopicCandidate = z.infer<typeof topicCandidateSchema>;
export type TopicGenerationRequest = z.infer<typeof topicGenerationRequestSchema>;

export const writerRequestSchema = z.object({ topicCandidateId: idSchema, title: z.string().trim().max(180).default('LinkedIn draft') }).strict();
export const writerResultSchema = z.object({ title: z.string().trim().min(1).max(180), body: z.string().trim().min(1).max(3000), sourceFactIds: z.array(idSchema).max(50), sourceResearchIds: z.array(idSchema).max(50) }).strict();
export const criticRequestSchema = z.object({ draftId: idSchema }).strict();
export const criticResultSchema = z.object({ summary: z.string().min(1).max(2000), strengths: z.array(z.string().max(500)).max(20), improvements: z.array(z.string().max(1000)).max(20), unsupportedClaims: z.array(z.string().max(1000)).max(20), score: z.number().min(0).max(100) }).strict();
export const revisionRequestSchema = z.object({ draftId: idSchema, critiqueId: idSchema.nullable().default(null), instructions: z.string().trim().max(2000).default('') }).strict();
export const revisionResultSchema = z.object({ body: z.string().trim().min(1).max(3000), preservedFactIds: z.array(idSchema).max(50) }).strict();
export type WriterRequest = z.infer<typeof writerRequestSchema>;
export type WriterResult = z.infer<typeof writerResultSchema>;
export type CriticResult = z.infer<typeof criticResultSchema>;
export type RevisionResult = z.infer<typeof revisionResultSchema>;

export const publishingJobStatusSchema = z.enum(['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']);
export const scheduleRequestSchema = z.object({ draftId: idSchema, accountId: idSchema, revisionId: idSchema, scheduledAt: dateSchema, timezone: z.string().trim().min(1).max(80), idempotencyKey: idempotencyKeySchema }).strict();
export const analyticsEventInputSchema = z.object({ publishedPostId: idSchema.nullable().default(null), provider: z.string().trim().min(1).max(80), providerEventId: z.string().trim().min(1).max(240), eventType: z.string().trim().min(1).max(120), occurredAt: dateSchema, payload: z.record(z.unknown()) }).strict();
export const metricSnapshotInputSchema = z.object({ publishedPostId: idSchema, metricName: z.string().trim().min(1).max(80), value: z.number().finite().nonnegative(), observedAt: dateSchema, provider: z.string().trim().min(1).max(80), capability: z.string().trim().min(1).max(120) }).strict();
export type ScheduleRequest = z.infer<typeof scheduleRequestSchema>;
export const insightStatusSchema = z.enum(['CANDIDATE', 'ACCEPTED', 'DISMISSED']);
export const insightDecisionSchema = z.object({ decision: z.enum(['ACCEPTED', 'DISMISSED']) }).strict();
