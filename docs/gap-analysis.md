# Personal Brand AI — Repository Gap Analysis

Audit date: 2026-10-03  
Repository: `ssw94/personal-brand-assistant`  
Scope: read-only comparison of the current repository against the supplied Personal Brand AI Product Specification and Implementation Plan Specification, including the LinkedIn end-to-end audit brief.

## Audit method and status meanings

This audit traces implementation rather than page presence: persistence/schema → backend service/provider → API route → frontend client/query → route/navigation → UI. A page or route alone is not counted as a working capability.

- **IMPLEMENTED** — the capability is materially implemented end-to-end in the inspected repository.
- **PARTIALLY IMPLEMENTED** — a real slice exists, but a required boundary, state, persistence, integration, or enforcement layer is missing.
- **MOCKED** — the interface/contract exists but behavior is deterministic, local, credential-free, or otherwise not a production implementation.
- **MISSING** — no meaningful implementation was found.
- **INCORRECT** — implementation exists but does not satisfy the specified behavior or has a concrete correctness defect.
- **UNKNOWN** — the repository does not provide enough evidence to verify the requirement.

## 1. Executive summary

The repository is a production-minded career-workflow foundation with a genuine user-owned profile, resume, jobs, applications, interview preparation, assistant history, and content CRUD model. It also has a visible Content Studio route, content API, draft/revision/critique persistence, a state-transition helper, and user-scoped content queries.

It is not yet the specified Personal Brand AI product end-to-end. The most important gaps are:

1. There is no real AI model integration. Content, resume optimization, cover letter, interview, and career assistant providers are all safe deterministic mock providers.
2. There is no separated Professional Memory, Research, Topic, Writer, Critic, or Revision agent pipeline. Content generation is a single safe-mock provider over profile facts.
3. LinkedIn OAuth, account persistence, official API publishing, secure OAuth state, tokens, external post IDs, and publishing jobs are absent.
4. Scheduling is incorrect: the route requests a scheduled date, but `updateDraft` never writes `scheduledAt`; there is no worker that executes scheduled posts.
5. Analytics and analytics intelligence are absent.
6. Subscription, entitlement, usage, Stripe, renewal, and server-side limits are absent. The existing pricing is also inconsistent with the established INR plan configuration.
7. Resume editing exists, but resume upload/ingestion and a reusable Professional Memory layer do not.
8. Tests cover provider safety and a small content transition helper, but not the required persistence, approval, scheduling, entitlements, usage, provider, or end-to-end flows.

The repository is therefore best described as a **career assistant foundation with a partially implemented, intentionally mocked content workflow**, not a complete Personal Brand AI SaaS.

## 2. Architecture assessment

### Repository structure

| Requirement | Current implementation | Status | Relevant files | What is missing / incorrect | Recommended implementation | Dependencies | Priority |
|---|---|---|---|---|---|---|---|
| Monorepo with frontend, backend, shared contracts | npm workspaces contain `apps/web`, `apps/api`, and `packages/shared`; React/Vite, Express/Prisma, and Zod contracts are present. | IMPLEMENTED | `package.json`, `apps/web/package.json`, `apps/api/package.json`, `packages/shared/src/index.ts` | Product-specific boundaries are not yet separated into memory/research/agents/analytics/billing modules. | Retain the modular monolith and add feature boundaries under API and shared contracts. | Existing workspace and Prisma setup | P2 |
| Production-ready app architecture | A modular monolith, CI workflow, Vercel config, Dockerfile, CORS, rate limiter, and error handler exist. | PARTIALLY IMPLEMENTED | `apps/api/src/app.ts`, `apps/api/src/server.ts`, `.github/workflows/ci.yml`, `apps/web/vercel.json` | Provider integrations, workers, production AI, billing, and OAuth are not present; Docker execution has not been evidenced in this repository audit. | Add integrations behind server-side interfaces and verify deployment paths with environment-specific tests. | External providers and deployment environment | P1 |
| Avoid premature microservices | The code is a monolith with shared package contracts. | IMPLEMENTED | Repository structure | No current gap. | Keep a modular monolith until load/team boundaries justify extraction. | None | P3 |

### Frontend, backend, database, and API baseline

| Requirement | Current implementation | Status | Relevant files | What is missing / incorrect | Recommended implementation | Dependencies | Priority |
|---|---|---|---|---|---|---|---|
| Frontend exposes required product routes | Routes exist for dashboard, profile, resume, jobs, applications, interview prep, assistant, content modes, LinkedIn, billing, auth, and onboarding. | PARTIALLY IMPLEMENTED | `apps/web/src/main.tsx`, `apps/web/src/pages/ContentStudioPage.tsx`, `apps/web/src/pages/LinkedInPage.tsx` | Analytics, usage, subscription detail, research, memory, and true calendar views are not present. Content modes reuse one page and are not full product surfaces. | Add routes only after corresponding backend capabilities exist; expose a clear Personal Brand navigation group. | Feature APIs and UI specs | P1 |
| Backend API surface | Profile, resume, jobs, applications, packages, assistant, auth, and content routers are mounted. | PARTIALLY IMPLEMENTED | `apps/api/src/app.ts:38-45`, `apps/api/src/*Routes.ts` | No LinkedIn, OAuth, analytics, billing, usage, entitlements, research, memory, background-job, or Stripe routes. | Add server-authoritative feature endpoints with validation and ownership checks. | Prisma models and provider contracts | P0 |
| Database persistence | Profile/career and content strategy/pillar/idea/draft/revision/critique tables exist. | PARTIALLY IMPLEMENTED | `apps/api/prisma/schema.prisma` | No Professional Memory, research sources, agent runs, LinkedIn account, publishing job, published post, analytics event/snapshot, subscription, entitlement, usage, or Stripe tables. | Add only the models needed for the approved product scope, with user ownership and indexes. | Data model decisions | P0 |
| Shared validation contracts | Zod schemas cover profile, resume, career, assistant, and basic content. | PARTIALLY IMPLEMENTED | `packages/shared/src/index.ts:235-250` | No schemas for OAuth, research, memory, analytics, subscription, usage, entitlements, Stripe webhooks, or scheduling jobs. | Define shared request/response contracts before route implementation. | Database/domain design | P1 |

## 3. Feature-by-feature matrix

| # | Major capability / requirement | Evidence of current implementation | Status | Missing or incorrect behavior | Recommended implementation | Dependencies | Priority |
|---:|---|---|---|---|---|---|---:|
| 1 | Repository foundation | Monorepo, CI, Vite/React, Express/Prisma/PostgreSQL, shared Zod package. | IMPLEMENTED | No product-agent/analytics/billing feature boundaries. | Preserve foundation; extend modularly. | None | P2 |
| 2 | Frontend product shell | React Router, MUI theme, responsive Drawer/AppBar, content and career pages. | PARTIALLY IMPLEMENTED | Navigation is flat; dashboard is still generic and content page is largely Tailwind/legacy markup despite MUI theme. | Group Personal Brand, LinkedIn, Career, AI Assistant, Billing, Settings and use shared product components. | Design system docs | P2 |
| 3 | Backend/server | Express app with security headers, CORS, rate limits, JSON limit, global error handler, mounted routers. | IMPLEMENTED | It does not expose required product domains beyond the current foundation/content scaffold. | Add bounded modules and route-level tests. | Domain models | P1 |
| 4 | Database schema | User/Profile/career models plus ContentStrategy, ContentPillar, ContentIdea, ContentDraft, ContentRevision, ContentCritique. | PARTIALLY IMPLEMENTED | Product-wide SaaS and pipeline entities are absent. | Add memory/research/LinkedIn/publishing/analytics/billing/usage entities. | Schema review and migrations | P0 |
| 5 | API routes | Content routes support strategy, pillars, ideas, drafts, generation, transform, critique, schedule, publish. | PARTIALLY IMPLEMENTED | No API for LinkedIn account, OAuth, analytics, research, memory, usage, Stripe, entitlements, or background jobs; schedule input persistence is broken. | Implement and contract-test missing endpoints. | Models and providers | P0 |
| 6 | AI implementation | Provider interfaces exist for content, resume, cover letter, interview, and assistant. | MOCKED | Every inspected provider factory returns a safe deterministic mock; no LLM/provider SDK, prompt execution, model selection, retries, token usage, or production configuration. | Add a server-side approved model adapter with grounding, timeouts, retries, structured output, and usage accounting. | AI provider credentials, prompt/version policy | P0 |
| 7 | AI agents | No separate Topic, Writer, Critic, Revision, Research, or Analytics Intelligence agents. | MISSING | UI labels and provider methods do not establish agent boundaries. | Model agent runs and contracts, or implement bounded services with explicit inputs/outputs and traceability. | Professional Memory and research | P0 |
| 8 | AI workflows | Content generate → edit → critique → transform is wired through API and persisted draft/revision/critique records. | PARTIALLY IMPLEMENTED | No research/context stage, no real AI, no explicit agent orchestration, no analytics feedback loop, and no background execution. | Implement the full orchestrated workflow and run state. | Agent services, jobs, persistence | P0 |
| 9 | LinkedIn integration | A provider interface and `/linkedin`/history UI exist; UI says OAuth is unavailable. | MOCKED | No OAuth, secure state, LinkedIn account table, official API client, server token storage, profile retrieval, disconnect, publish API, or external IDs. | Implement official LinkedIn OAuth/API behind server routes and a provider interface; keep mock provider development-only. | LinkedIn app credentials and approved API scopes | P0 |
| 10 | Authentication | Signup/signin issue HS256 JWTs; API verifies bearer tokens; local identity headers are supported outside production. | PARTIALLY IMPLEMENTED | Frontend stores JWT/user in `localStorage`; forgot-password endpoint is a fixed response with no reset flow; VITE identity headers remain a development path. | Use secure session/OIDC integration, short-lived/rotated tokens, reset flow, and remove broad development identity for deployed use. | Identity provider/email delivery | P1 |
| 11 | Resume ingestion | Profile-backed resume builder and versioned JSON documents exist. | PARTIALLY IMPLEMENTED | No PDF/DOCX upload, parsing, ingestion, extraction, source-document storage, or memory extraction. | Add secure server-side file intake, parser, extraction review, and provenance links. | Object storage, parser, malware/file limits | P1 |
| 12 | Professional Memory | Profile facts are gathered by `facts(userId)` for content and career workflows. | PARTIALLY IMPLEMENTED | No memory entity, normalized facts, embeddings/search, provenance, confidence, edit history, or shared memory API. | Create a user-owned memory layer that references profile/resume facts and exposes grounded retrieval. | Resume ingestion and data model | P0 |
| 13 | Writing Style | ContentStrategy stores `writingVoice`; generation passes it to the provider. | PARTIALLY IMPLEMENTED | It is one free-text strategy field consumed by the mock, not an inferred/curated style profile with examples, controls, or versioning. | Add explicit writing-style preferences and sample-based style memory with user approval. | Professional Memory and settings UX | P1 |
| 14 | Research | No research route, model, service, provider, source, citation, or fetcher exists. | MISSING | Topic/context is only user input and profile fact matching. | Add approved research providers, source records, citations, freshness, budgets, and prompt-injection isolation. | Provider policy, web/search integration, security | P0 |
| 15 | Topic generation | Users can manually create ideas; content pillars/strategy are persisted. | PARTIALLY IMPLEMENTED | No AI-generated topics based on profile, audience, pillars, previous content, or research; no topic-agent route. | Implement Topic Agent with deduplication, provenance, approval, and usage enforcement. | Memory, research, usage | P0 |
| 16 | Writer | `generateDraft` calls `SafeMockContentProvider.generate`. | MOCKED | Output is deterministic string composition from matched fact text, not a writer model or structured generation workflow. | Implement grounded Writer Agent with editable output and source fact IDs. | AI provider, memory, topic context | P0 |
| 17 | Critic | `critiqueDraft` persists a critique from `SafeMockContentProvider.critique`. | MOCKED | Critique only checks simple text overlap and returns fixed summary/improvements; no hook/clarity/structure/relevance/readability rubric. | Implement structured Critic Agent with rubric scores, evidence, and critique-only output. | Writer output, AI provider | P1 |
| 18 | Revision | `transformDraft` supports rewrite/improve_hook/shorten/expand/regenerate and creates revisions through `updateDraft`. | PARTIALLY IMPLEMENTED | Revision is mock, only edited body is recorded; no revision comparison, restore/version UI, agent run metadata, or critique-guided revision. | Add revision service, diff/restore, source preservation, and Critic→Revision handoff. | Writer/Critic agents and UI | P1 |
| 19 | Content management | Strategy, pillars, ideas, drafts, revisions and critiques have Prisma persistence and user filters. | PARTIALLY IMPLEMENTED | Idea editing/status management, pillar UI, delete/edit content operations, full post list, pagination/search, and analytics metadata are incomplete. | Complete CRUD boundaries and content list/detail contracts. | Product UX and schema | P1 |
| 20 | Human approval | Status transitions enforce DRAFT→REVIEW→APPROVED and publishing checks `APPROVED`. | IMPLEMENTED | Approval is not a separately audited event and direct publish is not an asynchronous approval/publishing workflow. | Add approval actor/time audit and publish-job boundary. | Publishing model | P1 |
| 21 | Scheduling | UI sends `/drafts/:id/schedule`; status enum includes SCHEDULED. | INCORRECT | `updateDraft` parses `scheduledAt` but never adds it to `updateData`; no worker, queue, cancellation, rescheduling, timezone policy, or scheduled execution. | Persist schedule atomically and create a durable scheduler/worker with idempotent jobs. | Publishing jobs, queue/worker, timezone policy | P0 |
| 22 | Analytics | No analytics models, routes, client, page, chart, event capture, or metric aggregation. | MISSING | Dashboard shows no content activity/performance analytics. | Add event model, metric aggregation, API and analytics UI. | Published post/provider events | P1 |
| 23 | Analytics intelligence | No feedback loop from performance to Topic Agent or insight service. | MISSING | No recommendations, top-content analysis, follower/engagement ingestion, or intelligence. | Add analytics insight job and grounded recommendations. | Analytics ingestion, Topic Agent | P2 |
| 24 | Background jobs | No queue, worker, scheduler, cron, job table, retry/backoff, or process boundary. | MISSING | Publishing and scheduled execution cannot occur reliably outside request/response. | Add durable job records and worker process before production scheduling/publishing. | Deployment/runtime choice | P0 |
| 25 | Stripe | No Stripe dependency, route, customer/subscription model, checkout, webhook, or signature verification. | MISSING | Billing UI explicitly says Stripe is not connected. | Implement server-side Stripe customer/checkout/webhook synchronization. | Stripe account/secrets, subscription schema | P1 |
| 26 | Usage limits | User has a string `plan`; UI displays vague `aiUsage` text from `planCatalog`. | MISSING | No usage records, periods, counters, remaining usage, feature entitlements, renewal date, or API enforcement. | Add server-authoritative entitlement/usage service and atomic limit checks. | Subscription source of truth | P0 |
| 27 | Security | JWT validation, ownership filters, CORS, headers, rate limits, body limit, and no scraper exist. | PARTIALLY IMPLEMENTED | Local headers and localStorage tokens remain risky if misconfigured; no OAuth state/token lifecycle, Stripe verification, prompt-injection controls, upload hardening, or secret-scanning evidence. | Complete integration-specific security controls and add negative tests. | OIDC/LinkedIn/Stripe/file providers | P0 |
| 28 | Prompt injection protection | No external LLM/research prompt pipeline exists. | MISSING | There are no source trust boundaries, instruction/data separation, untrusted-page sanitization, or tool permission policies. | Add prompt-injection threat model and input isolation before research/LLM tools. | Research and model architecture | P0 |
| 29 | Tests | Provider unit tests, transition tests, validation tests, auth tests, HTTP boundary tests, and frontend smoke tests exist. | PARTIALLY IMPLEMENTED | Required content persistence, approval audit, scheduling, entitlements, usage, subscriptions, Stripe, LinkedIn, publishing failure/retry, calendar, analytics, and end-to-end tests are missing. | Add meaningful contract/integration tests around each stateful boundary. | Implemented features and test fixtures | P0 |
| 30 | UX/design system | Central MUI theme, responsive shell, and public/auth redesign exist. | PARTIALLY IMPLEMENTED | Content/profile/resume/career pages still mix Tailwind and MUI; no analytics/calendar UI, no reusable content/analytics components, and dashboard is not primarily Personal Brand. | Complete page migration against approved designs and shared components. | Final UX references | P2 |
| 31 | Pricing | Central `planCatalog` exists and all five plan IDs are present. | INCORRECT | Code advertises USD-style values `$19/$39/$79/$149`; the established pricing source of truth is INR: ₹0/₹499/₹999/₹1,999/₹4,999+ with post allowances. No server subscription config exists. | Replace with one centralized INR configuration shared by UI/backend and enforce it server-side. | Pricing decision and billing model | P0 |
| 32 | Documentation | README, feature audit, product specs, design specs, and AGENTS instructions exist. | PARTIALLY IMPLEMENTED | `docs/PRODUCT_FEATURE_AUDIT.md` is stale: it says content is missing even though content scaffold now exists; no agent contracts, integration env matrix, threat model, analytics spec, or current gap report existed before this audit. | Keep docs synchronized and add architecture/agent/security/runbook docs as features land. | Product decisions | P2 |

## 4. AI-agent matrix

The required pipeline is not represented as separate agents in the codebase. The current content provider is a single deterministic provider and the remaining AI providers follow the same safe-mock pattern.

| Agent / stage | Required behavior | Current trace | Status | Gap and recommendation | Priority |
|---|---|---|---|---|---:|
| Professional Memory | Curated, user-owned, provenance-aware fact store used by every agent. | `facts(userId)` queries Profile relations in `apps/api/src/contentService.ts`; resume JSON references profile IDs. | PARTIALLY IMPLEMENTED | No shared memory service, provenance/confidence, ingestion, retrieval, or edit history. Build this before multi-agent work. | P0 |
| Research | Gather context from approved sources, retain citations/freshness, isolate untrusted content. | No research code or route found. | MISSING | Add provider boundary, source persistence, citation model, budgets, and injection isolation. | P0 |
| Topic Agent | Generate ideas from memory, audience, pillars, prior content, and research. | `createIdea` only persists caller-supplied title/prompt; no topic-generation endpoint. | MISSING | Add an explicit topic service/agent and reviewable idea outputs. | P0 |
| Writer Agent | Produce a grounded, editable LinkedIn post from approved context. | `generateDraft` calls `SafeMockContentProvider.generate`; provider concatenates topic and matched fact text. | MOCKED | Replace with approved model adapter and structured grounding. | P0 |
| Critic Agent | Score and explain hook, clarity, structure, relevance, readability, and improvements. | `SafeMockContentProvider.critique` returns fixed fields based on simple overlap. | MOCKED | Add rubric schema, model call, evidence, and critique persistence. | P1 |
| Revision Agent | Apply critique or explicit user action and retain versions. | `transformDraft` supports action enum and `ContentRevision` records body. | PARTIALLY IMPLEMENTED | No critique handoff, model, restore/diff UI, or agent run trace. | P1 |
| Human approval | Explicit user approval before schedule/publish. | `allowed` state map blocks DRAFT→APPROVED; `publishDraft` checks APPROVED. | IMPLEMENTED | No approval audit event/actor and no durable publish job. | P1 |
| LinkedIn Publisher | Official API, OAuth account, server token, external ID, errors, retry. | `SafeMockPublishingProvider` returns `published` with null external ID and never contacts LinkedIn. | MOCKED | Implement official provider and durable publishing job; never interpret mock success as external publication. | P0 |
| Analytics | Capture publication/performance events and aggregate metrics. | No model/service/routes found. | MISSING | Add event ingestion and aggregated metrics. | P1 |
| Analytics Intelligence | Feed grounded insights and recommendations back to Topic Agent. | No implementation found. | MISSING | Add scheduled insight computation after analytics exists. | P2 |

### Trace of the currently visible content path

`SafeMockContentProvider` → `createContentProvider()` → `generateDraft()` / `critiqueDraft()` / `transformDraft()` → `/api/content/drafts/*` → `apps/web/src/lib/contentApi.ts` → `ContentStudioPage` routes `/content`, `/content/ideas`, `/content/calendar`, `/content/drafts`, `/content/scheduled`, `/content/published`, `/content/strategy` → Content Studio UI.

This trace is real for the content scaffold, but it terminates at a safe mock provider. There is no equivalent Research→Topic Agent→Writer Agent→Critic Agent→Revision Agent→LinkedIn API→Analytics→Analytics Intelligence loop.

## 5. End-to-end workflow assessment

| Pipeline segment | Evidence | Status | Finding |
|---|---|---|---|
| Professional Memory → Research | Profile fact query exists; no research service. | MISSING | No research/context layer. |
| Research → Topic Agent | No research or topic agent. | MISSING | Ideas are manual CRUD only. |
| Topic Agent → Writer | User topic is passed to safe provider. | MOCKED | No generated topic handoff or real writer. |
| Writer → Critic | Draft body can be critiqued through API. | MOCKED | Critic is deterministic and fixed. |
| Critic → Revision | Critique and transform endpoints exist independently. | PARTIALLY IMPLEMENTED | No critique-guided revision contract or agent orchestration. |
| Revision → Human Approval | State transitions and UI buttons exist. | IMPLEMENTED | Approval gate exists, but audit semantics are thin. |
| Human Approval → LinkedIn Publisher | Approved draft calls safe mock provider directly in HTTP request. | MOCKED / INCORRECT | No official LinkedIn publisher, no PUBLISHING job, no durable retry. |
| LinkedIn Publisher → Analytics | No external publishing record or analytics capture. | MISSING | No feedback loop. |
| Analytics Intelligence → Topic Agent | No analytics intelligence or topic agent. | MISSING | Closed-loop product behavior absent. |

## 6. Database/schema gaps

### Present

- `User`, `Profile`, `Experience`, `Education`, `Skill`, `Project`, `Certification`, `Achievement`.
- `Resume`, `ResumeVersion`, `ResumeOptimization`.
- Jobs, saved jobs, applications, interviews, follow-ups, conversations, cover letters.
- `ContentStrategy`, `ContentPillar`, `ContentIdea`, `ContentDraft`, `ContentRevision`, `ContentCritique`.
- User-scoped indexes exist for most current career/content queries.

### Missing or insufficient

- Professional Memory facts, provenance, confidence, source document links, embeddings/retrieval metadata.
- Resume source files and ingestion/extraction jobs.
- Research sources, snapshots, citations, freshness, source trust, and research runs.
- Agent runs, prompts/model versions, structured outputs, token/cost usage, and failure state.
- LinkedIn accounts, encrypted token references, OAuth state/nonce, profile metadata, scopes, disconnect/revocation state.
- Durable publishing jobs, retry attempts, idempotency keys, provider responses, external LinkedIn post IDs, and cancellation state.
- Analytics events, post metrics, follower snapshots, aggregation periods, and insight records.
- `Subscription`, `SubscriptionPlan`, `Entitlement`, `UsageRecord`, Stripe customer/subscription/event records.
- Typed enums/check constraints for most current status strings. `status` fields are plain `String` in Prisma.
- `ContentDraft.scheduledAt` exists, but the service does not persist the schedule input.

Recommended order: memory/ingestion → research/agent run records → LinkedIn/publishing jobs → analytics → subscription/usage. Add migrations incrementally with ownership indexes and idempotency constraints.

## 7. API/backend gaps

### Existing content API

`apps/api/src/contentRoutes.ts` exposes strategy, pillars, ideas, drafts, generation, transform, critique, schedule, and publish. Each route derives a user ID through `authenticateRequest`, and `contentService` uses `where: { id, userId }` for draft reads/updates. This is a real user-scoped scaffold.

### Defects and omissions

- `POST /drafts/:id/schedule` passes `scheduledAt` into `updateDraft`, but `updateDraft` only writes title/topic/body/sourceIdea/status; `scheduledAt` is omitted from `updateData`.
- `publishDraft` calls the provider directly from the request and never moves the record through `PUBLISHING`.
- `SafeMockPublishingProvider` returns a local `published` result with no external ID; it is not LinkedIn publication.
- No publish retry route, schedule cancellation route, reschedule contract, or timezone validation/policy.
- No pagination, full post querying by calendar range, analytics querying, or usage/entitlement response.
- `createPillar`/`createIdea` APIs exist, but the inspected Content Studio UI does not expose complete pillar CRUD or AI idea generation.
- No routes for memory, research, agent runs, LinkedIn OAuth/account, analytics, billing, Stripe, usage, entitlements, or background jobs.
- Global error handling exists, but there are no domain-specific error contracts for the missing asynchronous/provider boundaries.

## 8. UX gaps

- The dashboard in `apps/web/src/pages.tsx` shows profile completeness, active drafts, and follow-ups as `—`, plus generic getting-started actions. It does not show the required Personal Brand dashboard data.
- Content Studio is visible and usable for core draft actions, but its modal/editor is still primarily legacy Tailwind markup, and the “calendar” is a list of items rather than month/week/day calendar views.
- Ideas can be manually captured, but there is no visible AI topic generation, topic bank workflow, or complete pillar management UI.
- LinkedIn UI correctly says OAuth is unavailable and disables connection; this is honest but means the product requirement is not satisfied.
- Billing UI shows a plan from localStorage/session user and explicitly says usage/Stripe are not connected. It cannot show authoritative usage, renewal, or subscription state.
- No Analytics page, chart system, analytics cards, or intelligence recommendations.
- Profile and resume pages exist, but resume page is a builder over profile data, not resume ingestion.
- Navigation contains content labels but is flat and does not fully represent the required Personal Brand/Career/LinkedIn grouping.
- Shared MUI theme exists in `apps/web/src/theme`, but many pages still use Tailwind classes and raw `<button>`, `<input>`, and `<select>` markup. This is a design-system inconsistency, not evidence of missing backend behavior.

## 9. Security gaps

### Positive controls found

- API bearer JWT verification uses HS256, checks required claims/expiry, and supports issuer validation.
- Production rejects identity headers when configured correctly.
- Most services use user ownership in Prisma queries.
- CORS allowlist, security headers, request-size limit, rate limiting, and no scraper/source provider are present.
- README and env examples warn against exposing backend secrets through `VITE_*` variables.

### Gaps / risks

- JWTs are stored in browser `localStorage` (`apps/web/src/lib/session.ts`), increasing impact of XSS; the repository has no OIDC/secure cookie session integration.
- Local `x-user-id`/`x-user-email` headers remain accepted outside production and must never be enabled in a deployed environment.
- `forgot-password` always returns a generic message but does not implement reset tokens, expiry, delivery, or password change.
- No LinkedIn OAuth state/PKCE/nonce, token encryption, revocation, scope validation, or callback route exists.
- No Stripe webhook signature verification exists because Stripe is absent.
- No prompt-injection defense exists because no research/LLM tool pipeline exists; adding an LLM without those controls would be unsafe.
- No upload/file scanning boundary exists for resume ingestion.
- No evidence in the inspected repository of automated secret scanning or a threat model.

## 10. Testing gaps

### Evidence present

- Provider tests cover safe content grounding, critique-only labeling, resume optimization, cover letters, interview preparation, career assistant, and mock publishing.
- `contentService.test.ts` tests only transition helper behavior.
- API integration tests, auth tests, validation tests, frontend smoke tests, and shared/public plan tests exist.

### Missing tests

- Real content service persistence with ownership and revision creation.
- Full generate → view → critique → improve → save → approve → schedule/publish flow.
- Scheduled date persistence, timezone, reschedule, cancellation, worker execution, idempotency, and retry.
- PUBLISHING/PUBLISHED/PUBLISH_FAILED state behavior with provider failures.
- LinkedIn OAuth, token storage, official provider contract, disconnect, external ID, and publishing errors.
- Memory grounding, research citations, source freshness, prompt injection, and agent orchestration.
- Entitlement checks, atomic usage limits, period boundaries, subscription sync, and Stripe webhook signatures.
- Analytics event ingestion, aggregation, insights, and Topic Agent feedback.
- Browser route/navigation coverage for the required page matrix.

## 11. Pricing and billing gaps

`packages/shared/src/index.ts:36-40` defines the five IDs, but prices are `0`, `19`, `39`, `79`, and `149`, displayed as dollars in the public pricing/billing UI. The established product source of truth is INR: Free ₹0/3 posts, Creator ₹499/15, Pro ₹999/30, Expert ₹1,999/60, Team ₹4,999+/custom usage.

There is no backend pricing configuration, subscription plan table, entitlement map, usage record, customer ID, Stripe checkout, webhook, renewal, cancellation, or invoice state. Signup accepts a `plan` enum and stores a string on `User`, but that is not subscription enforcement and can be selected by the client.

Recommended implementation: create one server-owned plan/entitlement configuration, expose read-only plan data to the client, synchronize subscription state from Stripe webhooks, and make every metered API operation perform an atomic server-side entitlement check.

## 12. Documentation gaps

### Present

- `README.md` documents the current foundation and explicitly calls out safe-mock providers and unimplemented LinkedIn/Stripe behavior.
- `docs/PRODUCT_FEATURE_AUDIT.md` records the earlier milestone.
- `docs/product/` and `docs/design/` contain product/design source-of-truth documents.
- `AGENTS.md` establishes MUI, pricing, security, testing, and product documentation rules.

### Inconsistencies / missing operational documentation

- `docs/PRODUCT_FEATURE_AUDIT.md` is stale for the current content scaffold: it describes content and navigation as missing although schema/routes/UI now exist partially.
- No current agent contract or orchestration document.
- No memory/provenance model or research-source policy.
- No LinkedIn OAuth/API configuration and callback runbook.
- No Stripe webhook/event runbook.
- No usage/entitlement semantics or period-boundary specification.
- No analytics event/metric definition or insight loop specification.
- No prompt-injection threat model.
- No production readiness matrix distinguishing safe-mock from real integrations.

## 13. P0 gaps — product blockers

1. Replace the entirely safe-mocked AI path with an approved server-side model integration, while preserving grounding and editability.
2. Implement Professional Memory and resume/profile provenance before multi-agent generation.
3. Implement Research and Topic Agent with source/citation and prompt-injection boundaries.
4. Implement real Writer, Critic, and Revision agent contracts and orchestration.
5. Implement official LinkedIn OAuth/API integration, server token handling, account persistence, and publisher boundary.
6. Fix scheduling persistence and add durable background jobs, retries, idempotency, cancellation, and rescheduling.
7. Implement server-side subscriptions, centralized entitlements, usage records, and limit enforcement.
8. Resolve pricing mismatch between code and the established INR source of truth.
9. Add security controls for OAuth, tokens, prompt injection, uploads, and subscription webhooks.
10. Add end-to-end tests for the core pipeline and critical failure paths.

## 14. P1 gaps — important functionality

1. Resume upload/ingestion and reviewable extraction.
2. Complete idea/pillar/topic-bank workflows and AI-generated ideas.
3. Critic rubric and revision diff/restore UI.
4. Analytics event ingestion, post performance, follower growth, and content activity.
5. Stripe checkout/customer/subscription synchronization and billing period display.
6. Password reset and production-grade browser authentication/session integration.
7. Full calendar views and schedule management UI.
8. Backend/API pagination, date-range queries, and consistent typed error contracts.

## 15. P2/P3 gaps — supporting capability and polish

### P2

- Analytics intelligence and feedback into Topic Agent.
- Navigation hierarchy and complete Personal Brand dashboard presentation.
- Shared MUI migration for remaining legacy Tailwind/raw controls.
- Agent observability, model/prompt versioning, cost reporting, and admin diagnostics.
- Documentation refresh and production configuration matrix.

### P3

- Additional dashboard polish, loading/empty/error refinement, and visual consistency.
- Advanced filtering, search, pagination, bulk actions, and export where product decisions approve them.
- Performance optimization/code splitting after functionality is complete.

## 16. Recommended implementation order

1. **Establish data and trust boundaries:** finalize product contracts, typed statuses, pricing/entitlement model, Professional Memory, provenance, and authorization tests.
2. **Add ingestion:** secure resume/document ingestion with extraction review and memory writes that never overwrite user facts silently.
3. **Build research safely:** source records, citations, freshness, approved provider boundary, prompt-injection isolation, and research tests.
4. **Implement agents:** Topic, Writer, Critic, and Revision contracts, structured outputs, model adapter, agent-run persistence, and usage accounting.
5. **Complete content workflow:** idea generation, content CRUD, revision diff/restore, approval audit, and full end-to-end tests.
6. **Fix scheduling:** persist schedule, add durable publishing jobs/worker, timezone handling, retry/idempotency, cancellation, and rescheduling.
7. **Implement LinkedIn:** official OAuth/API, server-side encrypted token handling, account status, publish/history, external IDs, and provider failure tests.
8. **Implement monetization:** centralized INR plan config, Stripe customer/checkout/webhook sync, subscriptions, entitlements, usage records, and API-level limit tests.
9. **Add analytics:** event capture, post metrics, follower snapshots, dashboard/API, and believable UX.
10. **Close the loop:** analytics intelligence feeds grounded recommendations back to Topic Agent; then complete navigation and MUI UX convergence.

## CURRENT PRODUCT MATURITY

### Estimated completion by area

The following is a qualitative estimate based only on inspected code paths, persistence, API consumers, and tests; no unsupported numeric percentages are asserted.

| Area | Maturity estimate | Basis |
|---|---|---|
| Repository/platform foundation | Strong foundation | Monorepo, CI, build, API, Prisma, shared schemas, deployment configuration, and security middleware exist. |
| Profile and career workflows | Substantially implemented | Real user-scoped CRUD, resume versions, applications, interview preparation, and assistant persistence exist; production identity/provider gaps remain. |
| Content data model and basic workflow | Working scaffold | Real content tables, routes, frontend clients, revisions, critique persistence, and approval transitions exist. |
| AI content generation | Development-only | Safe-mock provider is the only factory implementation. |
| Multi-agent personal-brand pipeline | Not started as specified | No separate memory/research/topic/writer/critic/revision/analytics agents. |
| LinkedIn | Development placeholder | Provider interface and honest UI exist; no OAuth or official API integration. |
| Scheduling/background execution | Not production-capable | Schedule persistence is defective and no worker exists. |
| Analytics/intelligence | Not implemented | No models, routes, UI, aggregation, or feedback loop. |
| Billing/entitlements/usage | Not implemented | Only a client-visible plan string/catalog exists; no server enforcement or Stripe. |
| UX/design system | Foundation with inconsistency | MUI theme and shell exist, but many pages still mix legacy Tailwind/raw controls and required surfaces are absent. |
| Documentation | Good governance baseline, incomplete operational detail | Product/design/agent/security/integration runbooks need to evolve with implementation. |

### Major blockers

- No production AI provider or separated agent pipeline.
- No Professional Memory/research grounding layer.
- No official LinkedIn OAuth/publishing integration.
- No reliable scheduler/background job system.
- No analytics or analytics intelligence.
- No subscription, entitlement, usage, or Stripe system.
- Pricing is inconsistent with the established INR specification.

### Top 10 gaps

1. Professional Memory with provenance and retrieval.
2. Secure Research stage with citations and prompt-injection controls.
3. Real Topic Agent.
4. Real Writer/Critic/Revision agents.
5. Official LinkedIn OAuth and publisher.
6. Durable scheduling and publishing jobs.
7. Server-side subscription/entitlement/usage enforcement.
8. Correct centralized INR pricing.
9. Analytics and analytics intelligence feedback loop.
10. End-to-end tests for the complete content pipeline and provider failure paths.
