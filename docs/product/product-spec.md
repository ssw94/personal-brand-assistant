# Personal Brand AI — Product Specification

## Product definition

Personal Brand AI is an AI SaaS for software engineers and technology professionals. It turns a user-owned professional profile into a reliable workspace for personal-brand content, career materials, job workflows, and interview preparation.

The product should feel intelligent and helpful without fabricating facts. Generated material is editable, reviewable, and attributable to the user's source information where applicable.

## Product principles

1. Truth before polish: never invent a qualification, employer, project, metric, or achievement.
2. User control: AI drafts require review and explicit approval before publishing.
3. One professional source of truth: profile information powers downstream workflows.
4. Calm workflow: reduce context switching and make the next action obvious.
5. Provider boundaries: external integrations are explicit, secure, and replaceable.

## Product areas

- Public website: landing, features, pricing, sign in, sign up, and onboarding.
- Professional foundation: profile, experience, education, skills, projects, certifications, achievements, and resume documents.
- Career workflows: jobs, applications, application packages, interview preparation, and career assistant.
- Personal brand: content strategy, ideas, AI post generation, drafts, critique, improvement, approval, calendar, scheduling, publishing history, and analytics.
- Integrations and account: LinkedIn connection, billing, subscription, usage, and settings.

## Content workflow

Content follows a reviewable lifecycle: `DRAFT → REVIEW → APPROVED → SCHEDULED → PUBLISHING → PUBLISHED`, with `PUBLISH_FAILED` as a recoverable terminal state for an attempted publish. AI can generate, critique, and transform drafts; it cannot silently publish or change user facts.

## Scope boundaries

LinkedIn scraping is prohibited. LinkedIn features use official/approved APIs only. Production OAuth, publishing, AI vendors, Stripe, and usage enforcement require their respective secure server-side integrations; absent those integrations, the UI must state the limitation plainly.
