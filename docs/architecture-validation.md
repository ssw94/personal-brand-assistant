# Personal Brand AI — Architecture Validation

Validation date: 2026-10-04  
Inputs: `docs/gap-analysis.md`, `docs/product/product-spec.md`, current repository, `docs/architecture.md`, `docs/ai/*`, `docs/security/threat-model.md`, and `docs/implementation-plan.md`.

Scope: planning/documentation validation only. No application feature or code was implemented.

## A. APPROVED ITEMS

- The plan correctly keeps the current React/Vite + Express/Prisma/PostgreSQL + shared Zod monorepo as a modular monolith.
- Existing `User`, `Profile`, `Resume`, `ResumeVersion`, and content models are identified for evolution rather than replacement.
- The target flow is correctly modeled as Profile → Memory → Style → Research → Topic → Writer → Critic → Revision → Approval → LinkedIn → Analytics → Intelligence feedback.
- Domain boundaries for memory, research, agents, content, publishing, scheduling, analytics, intelligence, and billing are appropriate for this repository.
- The plan explicitly keeps AI/provider access server-side and requires structured, schema-validated outputs, prompt/model versions, retries, timeouts, usage metadata, cancellation, redaction, and fake transport tests.
- The plan does not depend on the deprecated OpenAI Assistants API. It defines a vendor-neutral Model Gateway instead.
- Professional Memory is specified as provenance-aware and user-approved; AI cannot silently promote or mutate source facts.
- Research is correctly treated as untrusted input with SSRF, allowlist, source-policy, and prompt-injection requirements.
- Topic, Writer, Critic, and Revision contracts are independently testable and provider-neutral.
- The orchestrator is explicitly the only component that sequences workflow stages.
- Human approval is a server-side prerequisite for scheduling and publishing.
- LinkedIn is correctly constrained to official/approved APIs with server-side tokens; scraping is prohibited.
- Publishing success requires provider confirmation and an external ID where the provider supplies one.
- Durable jobs, leases, retries, idempotency, and reconciliation are required for scheduling/publishing.
- Analytics is now required to discover provider capabilities and mark unavailable metrics instead of synthesizing them.
- Team pricing remains configurable, and the INR plan values are documented as the source of truth.
- The frontend direction is contract-driven and MUI-based; UI work is deferred until domain/API contracts stabilize.

## B. REQUIRED CORRECTIONS

The original plan required the following corrections, now applied to `docs/implementation-plan.md`:

1. **Phase 1 was too broad.** It originally listed future Memory, AI, LinkedIn, Analytics, Billing, and Stripe tables together. Phase 1 now limits database work to evolving existing Profile/Resume/Content models and shared ownership/audit/idempotency primitives. Each future domain owns its own migration phase.
2. **AI entities were repeated across Phases 1 and 2.** `AgentRun`, `AgentArtifact`, `PromptVersion`, and `ModelUsage` now belong to Phase 2 only. Phase 6 explicitly evolves existing `ContentDraft`/`ContentRevision` and does not create a parallel draft artifact model.
3. **Usage/Entitlements was too late.** Phase 15 now has 15A and 15B. 15A is a blocking entitlement/usage gate before Phase 5 and every production AI/publishing call; 15B completes reconciliation and paid-plan enforcement before Stripe/paid launch.
4. **Security was too late.** Phase 17 is now explicitly a final hardening pass. Phase 1, 2, 4, 11, 12, and 16 contain security gates that block dependent work.
5. **LinkedIn Analytics could be over-assumed.** Phase 13 now requires provider capability discovery and per-metric availability. No metric may be synthesized when the approved API does not provide it.

## C. ARCHITECTURE RISKS

- A large first migration could still become a de facto rewrite if ownership and status semantics are not finalized before Phase 1.
- Existing Prisma status fields are plain strings; a careless enum migration could break current content records.
- The current content service has a real scheduling defect (`scheduledAt` is parsed but not persisted); Phase 12 must include a migration/service fix and regression test.
- The current safe-mock providers could accidentally be treated as production if provider selection is not deny-by-default and visibly labeled.
- Model output quality, cost, latency, provider retention, and unsupported claims are unknown until Phase 2/3 evaluation data exists.
- Research, resume ingestion, and model context expand the prompt-injection/SSRF/privacy attack surface.
- LinkedIn publishing and analytics capabilities depend on external approval and may differ by account/API product.
- Background workers, leases, retries, and idempotency add operational complexity that is not present in the current request-only API.
- Subscription and usage race conditions can cause revenue loss or provider abuse if reservation/consumption is not atomic.
- Browser `localStorage` JWTs and development identity headers remain unsuitable for broad production exposure.

## D. MISSING DEPENDENCIES

- Approved AI provider, model list, data retention, region, cost budget, and vendor security review.
- Model Gateway transport and fake transport contract.
- Durable job/worker runtime, deployment model, lease mechanism, and monitoring.
- Secure browser session/OIDC provider and password-reset delivery mechanism.
- Resume/document object storage, parser, malware scanning, and extraction review policy.
- Professional Memory schema/provenance semantics and source precedence rules.
- Research provider/domain allowlist and citation/freshness policy.
- LinkedIn app approval, OAuth scopes, publishing/analytics capability matrix, webhook/callback configuration, and token encryption/key rotation.
- Stripe account/products, currency/amount configuration, webhook secret, and subscription-state mapping.
- Exact usage counting semantics, especially whether generation, scheduling, or successful publication consumes a post allowance.
- Team workspace membership/roles and custom usage agreement.
- Analytics retention, metric windows, privacy rules, and minimum data required for intelligence feedback.

## E. DATABASE MODEL CONFLICTS

### No blocking duplicate found

The current schema contains `User`, `Profile`, `Resume`, `ResumeVersion`, `ContentStrategy`, `ContentPillar`, `ContentIdea`, `ContentDraft`, `ContentRevision`, and `ContentCritique`. The corrected plan evolves these instead of introducing duplicates.

### Corrections enforced by the plan

- Do not add a second `ProfessionalProfile`, `ResumeDocument`, `Draft`, or `Post` model to replace existing records.
- `AgentArtifact` is a generic AI execution artifact and must reference existing content records; it is not a second draft table.
- `PublishedPost` represents the external publication/result relationship and is not a replacement for `ContentDraft`.
- `PublishingJob` is durable work state and is not a second content status model.
- `UsageRecord` and `UsagePeriod` are billing/measurement records, not copies of `User.plan`.
- `SourceDocument`/`MemorySource` preserve provenance; they do not duplicate Profile or Resume facts.

## F. API CONTRACT CONFLICTS

- The current content API exposes `/drafts/:id/schedule`, but the current service does not persist `scheduledAt`; the plan now assigns this correction to the durable scheduling phase with a required regression test.
- The current `/drafts/:id/publish` performs provider work inside the HTTP request; the target contract requires a publish command that creates/returns a durable job and only reports confirmed provider state.
- Existing `ContentDraft` schemas use string statuses; the implementation must introduce a compatibility/migration policy before tightening state validation.
- Current `contentApi.ts` accepts broad `unknown` request bodies; future domain clients must consume shared request/response schemas and typed error codes.
- No current routes exist for Memory, Research, Agent Runs, LinkedIn OAuth, Analytics, Usage, Entitlements, Stripe, or jobs; the plan correctly treats these as new contract boundaries.
- No UI contract may claim a connected LinkedIn account, analytics metric, paid entitlement, or production AI provider before a server response confirms it.

## G. SECURITY GAPS

- Production session architecture must replace or constrain localStorage JWT usage and development identity headers.
- OAuth state/PKCE/nonce, one-time expiry, redirect allowlists, token encryption, rotation, and revocation are prerequisites for LinkedIn.
- Research requires SSRF prevention, source allowlists, response limits, content isolation, and prompt-injection defenses before any external content reaches a model.
- Stripe requires raw-body signature verification and idempotent event processing before any entitlement changes.
- Resume ingestion requires upload size/MIME validation, quarantine, malware scanning, sandboxed parsing, and no executable content handling.
- AI logs require redaction of prompts, resumes, drafts, tokens, and provider responses by default.
- Every background job needs owner scope, bounded payloads, leases, retry caps, and idempotency.

## H. AI/MODEL GATEWAY GAPS

The planning documents specify the required gateway shape, but the current repository has only deterministic safe-mock provider files. Before any agent phase, the implementation must add:

- A server-only vendor-neutral `ModelGateway`; no React/provider SDK access.
- Versioned prompt/model registry and a request envelope carrying correlation/run IDs.
- Structured output schema validation with safe failure on malformed output.
- Explicit timeout, retry, cancellation, and provider-error classification.
- Token/input/output/cost accounting linked to usage reservation.
- Redacted structured logging and correlation across HTTP, agent run, and job.
- Fake transport/provider tests; no fake agent classes or fake production success.
- Explicit provider capability/configuration checks and deny-by-default production behavior.

There is no dependency on the OpenAI Assistants API in the plan. Any future OpenAI integration must use a currently approved API surface behind the Model Gateway and must not expose vendor concepts to domain agents.

## I. RECOMMENDED PHASE ORDER

1. Phase 1: evolve current schema and establish ownership/audit/idempotency/migration safety.
2. Phase 2: build the server-only Model Gateway and AI execution records.
3. Phase 3: add Professional Memory and Writing Style over Profile/Resume provenance.
4. Phase 4: add safe Research with citations, SSRF, and injection controls.
5. Phase 15A: activate deny-by-default entitlements and usage reservation before production agent calls.
6. Phases 5–8: implement independently testable Topic, Writer, Critic, and Revision agents.
7. Phase 9: add the orchestrator and traceable workflow runs.
8. Phase 10: add immutable human approval/audit gate.
9. Phase 11: implement official LinkedIn OAuth/publishing and capability discovery.
10. Phase 12: add durable scheduling/background jobs and fix scheduled-date persistence.
11. Phase 13: add capability-gated analytics.
12. Phase 14: add explainable Analytics Intelligence feedback.
13. Phase 15B: complete usage reconciliation, billing periods, and paid-plan enforcement.
14. Phase 16: add Stripe synchronization.
15. Phase 17: perform final security hardening and close integration-specific findings.
16. Phase 18: complete E2E/production validation and only then build the remaining UI surfaces.

## J. FINAL GO/NO-GO DECISION FOR PHASE 1

**GO, with guardrails, after the documented corrections.**

Phase 1 may begin because its corrected scope is limited to the existing Prisma domain, migration-safe evolution, ownership/audit/idempotency primitives, and shared contracts. It must not add all future domain tables, introduce duplicate Profile/Resume/Content models, or implement provider behavior.

Phase 1 is **NO-GO** if the implementation proposal expands into AI calls, agent classes, LinkedIn OAuth, Stripe, background workers, or UI pages before the Phase 1 schema/ownership/status decisions are reviewed and tested.
