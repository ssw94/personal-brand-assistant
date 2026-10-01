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
