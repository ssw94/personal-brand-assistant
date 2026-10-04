# Personal Brand AI — Dependency-Ordered Implementation Plan

This plan is based on `docs/gap-analysis.md`, the current Prisma/Express/React repository, and the Personal Brand AI product specification. It is planning-only. No phase below is implemented by this document.

## Delivery rules

- Implement one phase at a time with focused commits.
- Preserve the modular monolith; every new domain gets clear service, route, schema, and test boundaries.
- Do not add fake production AI or placeholder agent classes. Development adapters are allowed only when explicitly labeled and contract-compatible.
- Every phase runs lint, typecheck, tests, and build before its commit.
- UI work follows stable contracts and approved UX references; do not build disconnected pages first.

## Existing code reuse and replacement

### Reuse

- Prisma/PostgreSQL, `apps/api/src/prisma.ts`, existing User/Profile/Resume/career models, and ownership query patterns.
- `packages/shared/src/index.ts` Zod contract approach and content status vocabulary.
- `contentService.ts` persistence concepts for strategy, pillars, ideas, drafts, revisions, and critiques.
- `contentPublishingProvider.ts` provider interface idea, after changing semantics so mock success cannot represent external publication.
- `auth.ts` JWT verification shape, `app.ts` middleware/security/error handling, rate limiting, and CI/build scripts.
- `apps/web/src/theme/*`, `Layout.tsx`, TanStack Query, and existing page/test conventions.

### Replace or retire

- `SafeMockContentProvider` as a production path with a server-side Model Gateway and real agent services.
- Direct request-time `publishDraft` with an orchestrator + durable `PublishingJob` worker.
- `User.plan` as billing authority with Subscription/Entitlement/Usage services.
- The broken schedule update path once a durable scheduler exists.
- LocalStorage/dev-header authentication before broad production exposure.
- Legacy page-local raw controls where the shared MUI design system is required.

## Phase 1: Core domain/database

- **Objective:** establish authoritative domain entities, typed states, ownership, provenance, and idempotency foundations.
- **Required database changes:** evolve the existing `User`, `Profile`, `Resume`, `ResumeVersion`, `ContentStrategy`, `ContentPillar`, `ContentIdea`, `ContentDraft`, `ContentRevision`, and `ContentCritique` models; add only shared primitives needed by every later domain (ownership/audit/idempotency conventions and migration-safe typed status strategy). Do not create parallel profile, resume, or draft/artifact tables. Domain-specific tables are introduced in their owning phases.
- **Required APIs:** shared Zod contracts for new IDs, states, ownership, errors, job status, and plan/usage projections.
- **Required services:** domain repositories/policies, ownership guard, transaction/idempotency utilities, audit-event writer, secure migration/rollback helpers.
- **Required UI:** none beyond contract-safe existing surfaces; do not build individual pages yet.
- **Dependencies:** current schema audit and product decisions.
- **Tests:** migration/schema validation, ownership isolation, state/constraint tests, idempotency-key tests.
- **Security considerations:** direct user scoping, least-privilege relations, no raw tokens, immutable source-fact policy, migration rollback, and production authentication configuration checks. These are prerequisites, not a later hardening task.
- **Definition of done:** migrations apply cleanly; existing models are evolved rather than duplicated; shared ownership/status/idempotency contracts compile; no provider or UI behavior is implied.
- **Expected commit:** `feat: establish personal brand core domain`

## Phase 2: AI infrastructure

- **Objective:** provide a real server-side model boundary without implementing individual agents.
- **Required database changes:** add `AgentRun`, `AgentArtifact`, `PromptVersion`, and `ModelUsage`; these are generic AI execution entities, not content-draft replacements. Link content outputs to existing `ContentDraft`/`ContentRevision` records by reference.
- **Required APIs:** internal Model Gateway contract; authenticated run-status endpoint; no vendor SDK exposed to clients.
- **Required services:** ModelGateway, prompt registry/versioning, structured-output validator, timeout/retry/budget policy, redaction utility.
- **Required UI:** no new UI; expose only future-safe run status contracts.
- **Dependencies:** Phase 1, selected approved model provider, secret configuration.
- **Tests:** provider contract with fake transport, timeout/retry, schema rejection, redaction, budget, cancellation.
- **Security considerations:** server-only keys, prompt/data separation, content limits, redacted logs, cancellation propagation, provider allowlisting, and prompt-injection-safe input envelopes. This is an implementation gate for every later agent.
- **Definition of done:** model calls can be invoked only server-side through a versioned typed gateway with structured output validation, retry/timeout/cancellation, usage tracking, and fake transport tests; no fake agent is added.
- **Expected commit:** `feat: add server-side ai infrastructure`

## Phase 3: Professional Intelligence

- **Objective:** create Professional Memory and Writing Style as shared, reviewable inputs.
- **Required database changes:** add `SourceDocument`, `MemorySource`, `MemoryFact`, `MemoryFactVersion`, `WritingStyleProfile`, `WritingStyleExample`, and review decisions. These extend Profile/Resume provenance; they do not duplicate Profile, Resume, or ResumeVersion.
- **Required APIs:** memory list/review/update; style read/update/example management; source references.
- **Required services:** memory normalization/retrieval, profile/resume projection, style preference policy, approval workflow.
- **Required UI:** later profile/memory/style review surfaces; no isolated UI implementation in this planning task.
- **Dependencies:** Phase 1; existing Profile/Resume entities.
- **Tests:** fact ownership, provenance retention, approval/rejection, source updates, style isolation, no AI fact promotion.
- **Security considerations:** user facts are authoritative; redact private fields from model context unless explicitly permitted.
- **Definition of done:** agents can request a bounded, provenance-aware memory/style context without reading raw tables directly.
- **Expected commit:** `feat: add professional intelligence domain`

## Phase 4: Research

- **Objective:** add approved, citation-backed research as untrusted context.
- **Required database changes:** ResearchRun, ResearchSource, ResearchCitation, content hash, freshness, source policy, safety classification.
- **Required APIs:** create research run, get run/status, list sources/citations; all user-scoped and bounded.
- **Required services:** ResearchProvider interface, capability/allowlist registry, allowlisted fetcher, parser/summarizer via Model Gateway, citation resolver, SSRF defense, prompt-injection isolation, and source freshness policy.
- **Required UI:** later research/context review; no page-first work.
- **Dependencies:** Phases 1–3, approved provider/domain policy.
- **Tests:** source normalization, citation coverage, freshness, SSRF/URL policy, prompt injection corpus, timeout/size limits.
- **Security considerations:** retrieved text is data, not instructions; no arbitrary URLs, internal IPs, secrets, or unrestricted tools. Research provider capabilities must be explicit; absence of a provider must be a typed unavailable state, not empty/fake research.
- **Definition of done:** research artifacts are reviewable, cited, freshness-aware, and safe to pass to agents.
- **Expected commit:** `feat: add approved research boundary`

## Phase 5: Topic Agent

- **Objective:** generate reviewable topic candidates from memory, style, research, prior content, and analytics feedback when available.
- **Required database changes:** TopicCandidate/artifact references, novelty key, selection/rejection/audit state.
- **Required APIs:** create topic run, list candidates, select/edit/reject candidate.
- **Required services:** Topic Agent contract, context assembler, deduplication, source/rationale validator, usage reservation.
- **Required UI:** later ideas/topic workspace using candidate states.
- **Dependencies:** Phases 2–4 and the Phase 15A entitlement/usage gate; analytics feedback is optional until Phase 14, but the Topic Agent cannot run in production without metering.
- **Tests:** grounding, deduplication, ownership, candidate approval, injection resistance, usage limits.
- **Security considerations:** no candidate changes memory or publishes; research claims retain citations.
- **Definition of done:** candidate generation is real, typed, traceable, reviewable, and not a post/publish operation.
- **Expected commit:** `feat: add topic agent contract and workflow`

## Phase 6: Writer Agent

- **Objective:** turn one approved topic/context bundle into an editable grounded draft.
- **Required database changes:** no new draft model; link the Phase 2 `AgentArtifact` to the existing `ContentDraft`/`ContentRevision`, and add only missing source/claim references.
- **Required APIs:** create writer run, read run/artifact, create draft from selected topic.
- **Required services:** Writer Agent, claim/source resolver, platform constraint validator, content usage reservation.
- **Required UI:** later Content Studio generation/editor integration.
- **Dependencies:** Phases 2–5 and existing content persistence.
- **Tests:** supported/unsupported claims, source refs, character limits, idempotency, model failure, user ownership.
- **Security considerations:** never write source facts; redact context; no direct publishing permission.
- **Definition of done:** real provider output is structured, editable, grounded, persisted, and explicitly marked for review.
- **Expected commit:** `feat: add writer agent workflow`

## Phase 7: Critic Agent

- **Objective:** provide structured critique without mutating the draft.
- **Required database changes:** expand ContentCritique or linked CritiqueArtifact with rubric scores, claim checks, model/run refs.
- **Required APIs:** critique run/status and critique retrieval.
- **Required services:** Critic Agent, rubric evaluator, platform rule checks, safety/claim checks.
- **Required UI:** later critique panel and quality indicators.
- **Dependencies:** Phases 2 and 6.
- **Tests:** rubric schema, critique-only invariant, score bounds, unsupported claim warnings, provider failures.
- **Security considerations:** critique cannot become source truth or silently edit/publish.
- **Definition of done:** critique is structured, explainable, persisted, and independently testable.
- **Expected commit:** `feat: add critic agent workflow`

## Phase 8: Revision Agent

- **Objective:** apply accepted critique/user actions into immutable revision history.
- **Required database changes:** revision diff, parent revision, accepted critique refs, agent run refs, restore metadata.
- **Required APIs:** revise, compare, restore, list revisions; all state/ownership checked.
- **Required services:** Revision Agent, diff/restore service, claim-preservation validator.
- **Required UI:** later revision history/diff/restore controls.
- **Dependencies:** Phases 6–7.
- **Tests:** revision immutability, diff correctness, restore, fact preservation, action/idempotency, failed revision.
- **Security considerations:** revision cannot bypass approval; prior content remains auditable.
- **Definition of done:** Critic→Revision handoff is explicit and every revision is reproducible/auditable.
- **Expected commit:** `feat: add revision agent workflow`

## Phase 9: Content Orchestrator

- **Objective:** coordinate agent stages and content artifacts into one workflow trace.
- **Required database changes:** WorkflowRun/Step records, transitions, artifact refs, failure/retry state.
- **Required APIs:** start workflow, get status, retry safe step, cancel eligible run.
- **Required services:** orchestrator, transition policy, context assembly, job creation, idempotency.
- **Required UI:** later unified Content Studio run/status states.
- **Dependencies:** Phases 1–8.
- **Tests:** happy path, invalid skips, retries, cancellation, duplicate requests, ownership, partial failure recovery.
- **Security considerations:** only orchestrator may sequence stages; no client-controlled state transition.
- **Definition of done:** full pre-approval chain is observable with durable step status and no hidden provider calls.
- **Expected commit:** `feat: add content workflow orchestrator`

## Phase 10: Human Approval

- **Objective:** make approval an explicit auditable gate before scheduling/publishing.
- **Required database changes:** ApprovalEvent with actor, timestamp, revision, decision, reason; immutable audit trail.
- **Required APIs:** submit for review, approve, reject/request changes, approval history.
- **Required services:** approval policy, revision lock/check, entitlement check, audit writer.
- **Required UI:** later review/approval experience with clear status and source/critique context.
- **Dependencies:** Phases 8–9.
- **Tests:** only latest eligible revision can approve; unauthorized actions; publish/schedule rejection before approval; audit entries.
- **Security considerations:** approval actor must be authenticated; no automation may self-approve.
- **Definition of done:** an approved immutable revision is the only input accepted by publisher/scheduler.
- **Expected commit:** `feat: add human approval workflow`

## Phase 11: LinkedIn OAuth/Publishing

- **Objective:** integrate official LinkedIn account connection and publishing safely.
- **Required database changes:** LinkedInAccount, encrypted token reference, OAuthState, provider profile, scopes, PublishedPost, PublishingAttempt.
- **Required APIs:** OAuth start/callback, account status/disconnect, publish command, history/detail.
- **Required services:** LinkedInProvider, OAuth state/PKCE, token encryption/rotation, provider error mapping.
- **Required UI:** later connection, publishing status, history, external ID/error states.
- **Dependencies:** Phases 1, 10, 15A; approved LinkedIn app/scopes and an explicit capability matrix for profile, publishing, and analytics APIs.
- **Tests:** OAuth state/PKCE/replay, token redaction, disconnect, provider contract, external ID confirmation, failure classification.
- **Security considerations:** official APIs only, server tokens, no scraping, no success without provider confirmation.
- **Definition of done:** a connected account can publish only approved content through official API and records a confirmed result.
- **Expected commit:** `feat: add linkedin oauth and publishing boundary`

## Phase 12: Scheduling/Background Jobs

- **Objective:** execute scheduled publishing reliably and safely.
- **Required database changes:** Job/lease/attempt tables, schedule timezone, cancellation/idempotency fields, PublishingJob.
- **Required APIs:** schedule/reschedule/cancel, job status, retry eligible failure.
- **Required services:** worker, scheduler poller, lease/retry/backoff, publisher adapter, reconciliation.
- **Required UI:** later calendar/status/retry controls.
- **Dependencies:** Phases 9–11 and runtime queue/worker deployment decision.
- **Tests:** due-job execution, duplicate worker, lease expiry, timezone, cancellation race, retry caps, provider outage.
- **Security considerations:** job ownership, bounded payloads, idempotency, no arbitrary internal job creation.
- **Definition of done:** scheduled approved posts execute once-or-reconcile, failures are visible/retryable, and `scheduledAt` persists correctly.
- **Expected commit:** `feat: add durable scheduling and background jobs`

## Phase 13: Analytics

- **Objective:** capture publication/performance events and expose trustworthy metrics.
- **Required database changes:** AnalyticsEvent, PostMetricSnapshot, FollowerMetricSnapshot, aggregation periods, provider cursor, and provider capability snapshots.
- **Required APIs:** metric ingestion/sync, post performance, dashboard aggregates, date-range filters.
- **Required services:** provider analytics adapter, capability discovery, event normalizer, aggregator, privacy/redaction policy. Metrics must be marked unavailable when the approved LinkedIn API does not provide them; do not synthesize impressions, follower growth, or engagement.
- **Required UI:** later analytics dashboard, post performance, activity cards, restrained charts.
- **Dependencies:** Phase 11 for account/provider capability discovery and approved LinkedIn analytics capabilities. Each metric is optional and capability-gated.
- **Tests:** event dedupe, aggregation correctness, date zones, missing metrics, provider pagination, ownership.
- **Security considerations:** metric scope/consent, no cross-user data, provider token boundaries.
- **Definition of done:** observed metrics are persisted, reproducible, source-labeled, and available by post/period.
- **Expected commit:** `feat: add analytics ingestion and metrics`

## Phase 14: Analytics Intelligence

- **Objective:** derive explainable insights and feed accepted feedback to Topic Agent.
- **Required database changes:** AnalyticsInsight, TopicFeedbackCandidate, metric refs, confidence, acceptance state.
- **Required APIs:** insights list/detail, accept/dismiss feedback, feedback eligibility.
- **Required services:** insight job, trend/baseline calculations, recommendation policy, Topic Agent feedback adapter.
- **Required UI:** later AI insights and feedback controls.
- **Dependencies:** Phases 5 and 13; sufficient metric history.
- **Tests:** metric calculation, explanation refs, no causal overclaim, acceptance flow, duplicate insight suppression.
- **Security considerations:** recommendations use only owned/allowed metrics and cannot change publishing state.
- **Definition of done:** accepted, explainable feedback can influence future topic candidates without becoming an unsupported fact.
- **Expected commit:** `feat: add analytics intelligence feedback loop`

## Phase 15: Usage/Entitlements

- **Objective:** enforce feature access and quotas server-side. This phase has two gates: **15A**, required before any production AI/agent work; and **15B**, full billing-period/usage reconciliation completed before paid launch.
- **Required database changes:** centralized plan/entitlement records, UsagePeriod, UsageRecord, reservations/idempotency.
- **Required APIs:** current plan/usage, entitlement check, limit response, internal consume/release/reconcile.
- **Required services:** entitlement resolver, atomic usage service, period calculator, plan projection.
- **Required UI:** later usage/limit states; no local plan authority.
- **Dependencies:** Phase 1 and the pricing decision. 15A must complete before Phase 5; 15B must complete before Phase 16 and production paid access.
- **Tests:** concurrent consumption, period rollover, plan changes, Team custom usage, bypass attempts, refund/release semantics.
- **Security considerations:** browser cannot set plan; every metered endpoint checks server state before side effects.
- **Definition of done:** 15A provides authoritative plan/feature policy, a safe usage reservation interface, and deny-by-default behavior for unmetered production capabilities; 15B adds complete periods, reconciliation, and paid-plan enforcement. Limits cannot be bypassed by alternate endpoints.
- **Expected commit:** `feat: add usage and entitlement enforcement`

## Phase 16: Stripe

- **Objective:** synchronize paid subscription state through signed Stripe events.
- **Required database changes:** StripeCustomer, Subscription provider IDs, StripeEvent/idempotency, billing period/cancellation fields.
- **Required APIs:** checkout session, portal/cancel request, billing summary, signed webhook endpoint.
- **Required services:** Stripe adapter, signature verification, event reconciler, subscription state machine.
- **Required UI:** later plan selection, checkout handoff, billing status, renewal/cancellation.
- **Dependencies:** Phases 1 and 15; Stripe account/products and secrets.
- **Tests:** signature/replay, duplicate events, out-of-order events, failed payment, cancellation, entitlement sync.
- **Security considerations:** raw-body signature verification, server-side state, secret isolation, redacted logs.
- **Definition of done:** Stripe is the source of paid subscription events and entitlements converge idempotently.
- **Expected commit:** `feat: add stripe subscription synchronization`

## Phase 17: Security hardening

- **Objective:** close integration and production security gaps before broad exposure. This phase is a final hardening pass, not the first time security is considered; Phase 1, Phase 2, Phase 4, Phase 11, Phase 12, and Phase 16 each have blocking security gates.
- **Required database changes:** security audit events, token/key rotation metadata, retention fields where required.
- **Required APIs:** secure session/OIDC integration, password reset if retained, account revoke, admin/provider disable controls.
- **Required services:** threat controls, redaction, secret rotation, upload sandbox, prompt-injection guardrails, SSRF protection.
- **Required UI:** later security/account status and honest provider states.
- **Dependencies:** all applicable provider and billing phases.
- **Tests:** threat-model corpus, auth/session, tenant isolation, OAuth CSRF, SSRF, injection, upload, secret exposure, rate-limit abuse.
- **Security considerations:** this phase validates the controls already required by the threat model, not just headers.
- **Definition of done:** security review findings are closed or explicitly accepted with owner and expiry.
- **Expected commit:** `feat: harden production security boundaries`

## Phase 18: E2E/Production

- **Objective:** prove the product works across real boundaries and is deployable.
- **Required database changes:** production migration rehearsal, indexes/retention verification, rollback plan.
- **Required APIs:** final versioning, health/readiness, operational status, provider configuration validation.
- **Required services:** production worker deployment, monitoring/alerts, reconciliation jobs, support/runbook tooling.
- **Required UI:** implement approved pages only after contracts pass; complete dashboard, Studio, calendar, analytics, billing, LinkedIn, memory, and settings surfaces.
- **Dependencies:** Phases 1–17 and approved external credentials/sandbox accounts.
- **Tests:** full E2E generate→critique→revise→approve→schedule/publish→metrics→feedback; production-like integration; load/rollback/chaos for jobs; complete CI.
- **Security considerations:** secret review, CORS/session configuration, webhook/OAuth checks, privacy/retention verification.
- **Definition of done:** lint, typecheck, unit, integration, E2E, production build, migrations, observability, and documented runbooks pass; mock mode is never confused with production.
- **Expected commit:** `feat: validate personal brand ai production workflow`

## Dependency graph

```text
Phase 1 Core domain/database
 ├── Phase 2 AI infrastructure
 │    └── Phase 3 Professional Intelligence
 │         └── Phase 4 Research
 │              ├── Phase 15A Usage/Entitlement gate
 │              └── Phase 5 Topic Agent
 │                   └── Phase 6 Writer
 │                        └── Phase 7 Critic
 │                             └── Phase 8 Revision
 │                                  └── Phase 9 Orchestrator
 │                                       └── Phase 10 Human Approval
 │                                            ├── Phase 11 LinkedIn
 │                                            │    └── Phase 12 Scheduling/Jobs
 │                                            │         └── Phase 13 Analytics
 │                                            │              └── Phase 14 Intelligence
 │                                            │                   └── Topic feedback
 │                                            └── Phase 15B Usage reconciliation
 │                                                 └── Phase 16 Stripe
 └── Phase 17 Security hardening
      └── Phase 18 E2E/Production
```

Phase 15A is a prerequisite gate before Phase 5 and every production agent/publishing call. Phase 15B completes reconciliation and paid-plan enforcement before Phase 16/production paid access. Phase 17 also spans every phase; its late placement is only the final audit/hardening pass. LinkedIn Analytics is capability-gated per provider and never assumed to exist merely because publishing exists.

## Priority classification

### P0

Core domain/database, Professional Memory, AI infrastructure, Research safety, Topic/Writer/Critic/Revision contracts, orchestrator, approval integrity, LinkedIn publishing, durable scheduling, usage/entitlements, pricing correctness, prompt-injection protection, and core E2E tests.

### P1

Resume ingestion, writing-style depth, Critic/Revision UX, official analytics, Stripe synchronization, production authentication/session hardening, full calendar operations, and integration contract tests.

### P2

Analytics Intelligence, dashboard completion, navigation hierarchy, shared MUI migration, observability/cost dashboards, documentation/runbooks, and advanced filtering.

### P3

Visual polish, secondary exports, performance optimization, and non-blocking convenience features after the product loop is reliable.

## Expected files/modules to change

### Backend

- `apps/api/prisma/schema.prisma` and new migrations.
- New domain modules under `apps/api/src/`: `memory/`, `ingestion/`, `style/`, `research/`, `agents/`, `publishing/`, `scheduling/`, `analytics/`, `intelligence/`, `billing/`, `usage/`, `observability/`.
- Existing `contentService.ts`, `contentRoutes.ts`, `contentPublishingProvider.ts`, `auth.ts`, and `app.ts` will be evolved or narrowed, not duplicated.
- `apps/api/src/prisma.ts`, `rateLimit.ts`, env examples, and server/worker entry points.

### Shared contracts

- `packages/shared/src/index.ts` or split contract files for domain schemas, states, errors, plans, agent envelopes, and API projections.

### Frontend, later in the implementation sequence

- `apps/web/src/lib/*` API clients/hooks for domain contracts.
- `apps/web/src/components/` reusable memory, content, calendar, analytics, billing, and status components.
- `apps/web/src/pages/` and `main.tsx` routes only after APIs are real.
- `apps/web/src/theme/*` for approved design-system refinements.

### Documentation/operations

- AI prompt/model registry documentation, threat model, metric definitions, provider runbooks, migration/rollback notes, and CI/deployment configuration.

## Risks

- LinkedIn API permissions or product restrictions may limit publishing/analytics scope.
- Real model output may introduce unsupported claims, latency, cost, and provider-retention concerns.
- Resume parsing and research introduce untrusted-input and prompt-injection risk.
- Durable job execution requires a deployment/runtime decision and operational monitoring.
- Analytics availability and granularity may vary by official provider access.
- Pricing/usage semantics, especially Team custom usage and counting scheduled posts, need product confirmation.
- Existing string status fields and legacy content service may require careful migration to avoid breaking current drafts.
- Browser auth and external OAuth choices affect deployment and token security.

## Open questions

1. Which approved AI model provider(s), data-retention policy, region, and maximum context/cost limits are required?
2. Which LinkedIn API products/scopes are approved for profile, publishing, and analytics, and is the application approved for them?
3. Is Research limited to an approved search provider/domain allowlist, or should users supply URLs?
4. Is Professional Memory account-scoped only, or will Team workspaces require shared memory with roles?
5. What exact actions consume each quota: generation, successful post, scheduled post, critique, or provider attempt?
6. Does a scheduled post consume usage at scheduling time or publication time?
7. What is the Team billing/usage contract behind `₹4,999+`?
8. Which calendar timezone is authoritative and how are daylight-saving changes handled?
9. What analytics retention, aggregation windows, and privacy rules are required?
10. Which secure browser session/OIDC provider replaces localStorage JWTs before production exposure?
11. Which worker runtime/queue is acceptable for the modular monolith deployment?
12. Which approved UX reference screens are final for the future page implementation?
