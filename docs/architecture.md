# Personal Brand AI — Target Architecture

This document describes the implementation target. It does not imply that the target components currently exist. Current implementation status is recorded in [`docs/gap-analysis.md`](gap-analysis.md).

## Architecture decisions

1. Keep a modular monolith in `apps/api` with explicit domain modules. Do not introduce microservices before scale, ownership, or deployment constraints require them.
2. Keep `apps/web` as a React/Vite client and `packages/shared` as the source of shared Zod contracts and safe client-visible types.
3. PostgreSQL/Prisma is the system of record for user-owned facts, workflow state, billing state, jobs, and audit records.
4. All AI calls and external integrations are server-side. The browser receives structured, redacted results and never provider credentials.
5. Separate user facts from AI outputs. AI outputs must carry provenance, model/prompt version, run ID, and a review status.
6. Use durable job records and a worker boundary for research, scheduled publishing, provider retries, analytics ingestion, and insight generation.
7. Make every state transition explicit, authorized, idempotent, observable, and testable.
8. MUI remains the primary UI system with one centralized theme; UI work follows the approved UX reference after the domain contracts are stable.

## Target domain boundaries

```text
Profile + Resume Ingestion
        ↓
Professional Memory ───────────────┐
        ↓                          │
Writing Style ─────────────────────┤
        ↓                          │
Research Agent → Topic Agent       │
        ↓              ↓           │
                 Writer Agent      │
                       ↓           │
                 Critic Agent      │
                       ↓           │
                Revision Agent     │
                       ↓           │
                Human Approval     │
                       ↓           │
                LinkedIn Publisher │
                       ↓           │
                    Analytics ─────┘
                       ↓
             Analytics Intelligence
                       ↓
                 Topic feedback
```

### Domain modules

- `identity`: accounts, sessions, authorization context, onboarding.
- `profile`: professional profile and editable source facts.
- `ingestion`: uploaded resume/source documents, extraction jobs, review.
- `memory`: normalized facts, provenance, confidence, retrieval, user corrections.
- `style`: explicit writing preferences and approved style examples.
- `research`: approved sources, fetch/snapshot, citation, freshness, safety classification.
- `agents`: model gateway, prompt registry, agent contracts, runs, budgets, redaction.
- `content`: pillars, ideas, drafts, revisions, critiques, approval transitions.
- `publishing`: LinkedIn accounts, OAuth, provider abstraction, publishing jobs, history.
- `scheduling`: durable due work, timezone rules, cancellation/rescheduling.
- `analytics`: publication/performance events, metrics, aggregation, snapshots.
- `intelligence`: analytics-derived insights and feedback candidates for Topic Agent.
- `billing`: plans, subscriptions, entitlements, usage, Stripe synchronization.
- `observability`: structured logs, correlation IDs, audit events, metrics, provider traces.

## Data ownership and persistence

Every user-owned record carries `userId` directly or reaches it through a relation. Service methods must scope reads, writes, and deletes by the authenticated subject. Cross-user joins are prohibited unless an explicit team/workspace authorization model exists.

Required model groups:

- **Memory:** `MemoryFact`, `MemorySource`, `MemoryFactVersion`, optional retrieval/vector metadata.
- **Ingestion:** `SourceDocument`, `IngestionJob`, `ExtractionCandidate`.
- **Style:** `WritingStyleProfile`, `WritingStyleExample`.
- **Research:** `ResearchRun`, `ResearchSource`, `ResearchCitation`, `ResearchArtifact`.
- **Agents:** `AgentRun`, `AgentArtifact`, `PromptVersion`, `ModelUsage`.
- **Content:** retain and evolve existing `ContentStrategy`, `ContentPillar`, `ContentIdea`, `ContentDraft`, `ContentRevision`, `ContentCritique`; add approval/audit records and explicit typed state semantics.
- **Publishing:** `LinkedInAccount`, `OAuthState`, `PublishingJob`, `PublishedPost`, `PublishingAttempt`.
- **Analytics:** `AnalyticsEvent`, `PostMetricSnapshot`, `FollowerMetricSnapshot`, `AnalyticsInsight`.
- **Billing:** `SubscriptionPlan`, `Subscription`, `Entitlement`, `UsagePeriod`, `UsageRecord`, `StripeCustomer`, `StripeEvent`.

Use database constraints for unique external IDs, idempotency keys, plan identifiers, and one active subscription per account. Add indexes for `(userId, status)`, due jobs, date ranges, external IDs, and aggregation keys. Avoid storing raw provider tokens; use an encrypted secret reference or an encryption-at-rest strategy with key rotation.

## API boundaries

The API is the authoritative boundary for authorization, entitlements, state transitions, model calls, provider calls, and job creation. Shared request/response schemas live in `packages/shared`; domain-specific services own persistence and policy.

Target route groups:

```text
/api/profile
/api/memory
/api/style
/api/ingestion
/api/research
/api/agents
/api/content
/api/approval
/api/linkedin
/api/publishing
/api/calendar
/api/analytics
/api/intelligence
/api/billing
/api/usage
/api/jobs              (internal/operational, never browser-authoritative)
```

Long-running actions return a run/job identifier and status rather than keeping an HTTP request open. Synchronous endpoints are reserved for small validated mutations and reads.

## Background-job boundaries

The request API creates durable jobs; a worker claims jobs using leases, performs idempotent work, records attempts, and emits terminal success/failure events. Required job kinds include extraction, research fetch, agent run, scheduled publish, publish retry, analytics import, metric aggregation, insight generation, and Stripe reconciliation.

Each job has: owner, kind, payload reference, status, scheduled time, lease expiry, attempt count, max attempts, idempotency key, last error, and timestamps. Provider calls must have timeouts and bounded retries with backoff. A job must be safe to run twice.

## Integration boundaries

- **AI:** `ModelGateway` accepts a versioned prompt/input envelope and returns structured output plus usage metadata. No agent imports a vendor SDK directly.
- **Research:** `ResearchProvider` returns normalized sources and citations; untrusted text is data, never executable instructions.
- **LinkedIn:** `LinkedInProvider` handles approved OAuth/profile/publish operations; tokens stay server-side; development provider must report mock status explicitly.
- **Stripe:** `BillingProvider` creates checkout/customer actions and verifies signed webhook events; browser input cannot establish subscription state.
- **Storage:** source documents and large artifacts use controlled object storage references, not unbounded database blobs.

## Observability

Use correlation IDs across HTTP request → agent run → job → provider attempt. Record structured event names, user/account ID, feature, run/job ID, provider, model/prompt version, latency, token/cost metadata, status, and redacted error category. Never log tokens, full resumes, raw research pages, prompts containing secrets, or full private content by default.

## Reuse versus replacement

### Reuse

- `apps/api/src/auth.ts` authentication verification shape, after production session hardening.
- Existing Profile/Resume/career Prisma entities and ownership patterns.
- `apps/api/src/contentService.ts` as a temporary content persistence seam, after fixing scheduling and extracting policies.
- `packages/shared/src/index.ts` Zod approach and existing content state vocabulary, after adding typed domain contracts.
- `apps/api/src/contentPublishingProvider.ts` interface concept, replacing its safe mock as the only provider.
- `apps/web/src/theme/*`, `Layout.tsx`, and MUI components as the UI foundation.
- Existing rate limiting, security headers, CORS, error handling, and test conventions.

### Replace or retire

- `SafeMockContentProvider` as the production provider; retain only as an explicit test/development adapter.
- `SafeMockPublishingProvider` as a successful publishing path; it must never represent real LinkedIn publication.
- Direct `publishDraft` request-time publishing with a durable publishing job/orchestrator.
- Flat/string-only `User.plan` as billing authority with subscription/entitlement/usage services.
- The current localStorage/dev-header production path with a secure browser session/OIDC integration before broad exposure.
- Legacy page-local Tailwind/raw form controls where shared MUI components are required.
