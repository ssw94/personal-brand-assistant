# Product Feature Audit

Audit baseline: current `main` branch at the production-hardening milestone.

## Existing foundation and career modules

### IMPLEMENTED

- Monorepo foundation with `apps/web`, `apps/api`, and `packages/shared`.
- React/Vite frontend, Express/TypeScript API, Prisma/PostgreSQL schema, shared Zod contracts, Docker database setup, GitHub Actions CI, and Vercel SPA configuration.
- Profile CRUD with personal details, experience, education, skills, projects, certifications, and achievements.
- Resume builder with profile-backed documents, versions, autosave, section configuration, preview, duplicate, and delete.
- Safe resume optimization provider with reviewable suggestions and no automatic invention of user facts.
- Manual jobs, saved jobs, applications, status history, notes, dates, and resume/cover-letter references.
- Safe cover-letter provider and editable application package.
- Interview preparation with generated preparation material, stage/date, notes, and user-authored answers.
- Grounded career assistant with evidence and persisted `AIConversation` history.
- User-owned query authorization, local-only development identity headers, production JWT verification, API validation, rate limiting, security headers, database indexes, frontend error boundary, and integration tests.

### PARTIALLY IMPLEMENTED / BROKEN

- The frontend still uses development identity headers and has no OIDC/session login flow. Production API authentication is now secure, but a browser authentication integration is still required before broad production exposure.
- AI providers are safe mock providers. Vendor/provider configuration seams exist for resume, cover letter, interview, and career assistant use cases, but no production AI vendor is connected.
- Deployment infrastructure is present, but Docker image execution has not been verified locally because the Docker daemon is unavailable.
- Prisma CLI dependency audit reports unresolved transitive advisories; a Prisma major upgrade would require a separate schema/config migration.

## Original core product requirements

## 1. Audit and product scope

**IMPLEMENTED:** This document and the existing feature audit baseline.

**MISSING:** Personal-brand product implementation is not present in the current routes, schema, services, or navigation.

## 2. AI content assistant

**IMPLEMENTED:** Existing AI abstraction patterns, profile-backed facts, safe mock providers, and editable generated outputs for resume, cover letters, interview preparation, and career answers.

**MISSING:** Content ideas, content pillars, target audience, writing voice, LinkedIn post generation, rewrite/improve/shorten/expand, critique, regenerate, content drafts, and content revision history.

## 3. Content workflow

**MISSING:** The DRAFT → REVIEW → APPROVED → SCHEDULED → PUBLISHING → PUBLISHED/PUBLISH_FAILED state machine, explicit approval gate, scheduling, publishing, and retry workflow.

## 4. LinkedIn

**MISSING:** OAuth, secure OAuth state, account connection/disconnection, LinkedIn profile status, publishing provider interface, publish history, publishing errors, and server-side token storage.

**PARTIALLY IMPLEMENTED:** Existing provider abstraction style and safe mock-provider convention can be reused. No LinkedIn credentials or production provider are present.

## 5. Content calendar

**MISSING:** Calendar routes, month/week views, scheduled content, rescheduling, cancellation, and publishing status UI/API.

## 6. Personal-brand dashboard

**PARTIALLY IMPLEMENTED:** A generic dashboard exists with application-oriented placeholder metrics and health status.

**MISSING:** LinkedIn connection, ideas, drafts, approval queue, scheduled/published content, activity, AI usage, subscription plan, remaining usage, and publishing schedule.

## 7. Content strategy

**MISSING:** Content pillars, target audience, posting frequency, recurring themes, topic bank, content ideas, AI-generated ideas, and planned content.

## 8. Subscriptions

**MISSING:** `Subscription`, `SubscriptionPlan`, `Entitlement`, `UsageRecord`, plan management, and centralized subscription state. No plans (`FREE`, `CREATOR`, `PRO`, `EXPERT`) exist.

## 9. Feature entitlements

**MISSING:** Server-side entitlement and usage enforcement for AI content, critique, ideas, LinkedIn publish/schedule, calendar, advanced strategy, AI resume, job assistant, and team features.

## 10. Stripe

**MISSING:** Stripe customer, checkout, subscription synchronization, cancellation, billing period, signed webhook handling, and billing routes/UI.

**PARTIALLY IMPLEMENTED:** Environment-file conventions and backend-only secret handling exist, but no Stripe integration or provider abstraction exists.

## 11. Usage tracking

**MISSING:** Server-side usage records, period counters, remaining usage API, renewal information, and API-level limit prevention.

## 12. Database

**IMPLEMENTED:** Existing `User` and `Profile` entities, indexes for career workflows, and Prisma persistence.

**MISSING:** Content, LinkedIn, publishing, subscription, entitlement, usage, Stripe, and content-history entities.

## 13. Navigation

**PARTIALLY IMPLEMENTED:** Dashboard, profile, resume, jobs, applications, application package, interview prep, career assistant, and settings routes exist.

**MISSING:** Personal Brand grouping, content ideas, content studio, content calendar, published posts, content strategy, LinkedIn connection/history, billing, and usage routes.

## 14. Security

**IMPLEMENTED:** User ownership checks, production JWT verification, local-auth restriction, CORS, security headers, body-size limits, rate limiting, and no browser exposure of backend secrets.

**MISSING:** LinkedIn OAuth state/token lifecycle and Stripe webhook signature verification because those integrations do not yet exist.

## 15. Testing

**IMPLEMENTED:** Meaningful provider, validation, auth, and HTTP boundary tests for the existing career modules.

**MISSING:** Content state machine, approval gate, entitlements, usage limits, subscription synchronization, Stripe webhook, LinkedIn provider, publishing failures, and calendar scheduling tests.

## 16. Vercel

**IMPLEMENTED:** `apps/web/vercel.json`, SPA rewrites, monorepo build command, environment-based API URL, no production localhost fallback, and documented CORS setup.

**REMAINING:** Production browser authentication must be connected to an OIDC/session provider without putting tokens in Vite environment variables.

## 17. Final validation

**IMPLEMENTED:** Lint, strict typecheck, unit tests, HTTP integration tests, production build, Prisma validation, Compose config validation, and secret/temporary-file review are part of the current workflow.

**REMAINING:** Docker image execution and production OAuth/Stripe provider tests require external services and credentials, which are intentionally not fabricated.

## Priority implementation order

1. Personal-brand content model, safe content provider, drafts, revisions, critique, and approval state machine.
2. Content strategy and ideas.
3. Calendar and publishing provider boundary.
4. LinkedIn OAuth/publishing persistence with mock development provider.
5. Subscription, entitlement, and usage system.
6. Stripe architecture and signed webhook flow.
7. Personal-brand dashboard and navigation refresh.
