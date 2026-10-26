# Product Feature Audit

Audit baseline: `main` at the production-hardening milestone (2026-10-26).

## Implemented

- Monorepo foundation with React/Vite, Express/TypeScript, Prisma/PostgreSQL, shared Zod contracts, CI, Docker database setup, and Vercel SPA configuration.
- User-owned profile CRUD, resume builder/versioning, safe resume optimization, manual jobs, saved jobs, applications, application packages, interview preparation, and grounded career assistant.
- Server-only Model Gateway with structured outputs, prompt registry, retries, cancellation, usage metadata, redaction, and deterministic provider tests.
- Professional Memory and Writing Style with provenance-aware, reviewable records.
- Research boundary with HTTPS allowlisting, DNS/private-network checks, size/content limits, source safety classification, and persisted provenance.
- Topic, Writer, Critic, Revision, orchestration, human approval, audit, idempotency, and ownership boundaries.
- Official LinkedIn OAuth/API boundary with state/PKCE, encrypted server tokens, capability discovery, publishing confirmation, and history.
- Durable scheduling jobs with leases, retries, cancellation, and idempotent replay.
- Capability-gated analytics and explainable Analytics Intelligence feedback.
- Centralized pricing catalog, server-side entitlements, posting reservations, Stripe checkout/portal entry points, and signed webhook synchronization.
- Public landing/pricing, authenticated browser sessions using the HttpOnly `pba_session` cookie, onboarding, account settings, sign-out, and billing surfaces.

## Remaining operational gates

These cannot be completed honestly inside the repository without deployment-specific credentials or infrastructure:

1. Configure and verify the deployment identity-provider decision if external OIDC is required.
2. Run PostgreSQL migration rehearsal and database-backed integration tests in disposable CI/deployment infrastructure.
3. Run credentialed sandbox E2E coverage across generation, approval, scheduling/publishing, provider metrics, Stripe synchronization, and failure recovery.
4. Complete deployment-specific worker, alerting, secret rotation, retention, rollback, and provider capability runbooks.
5. Verify Docker image execution and production probes on the target runtime.

## In-repository validation

The required baseline is:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The full test suite includes HTTP integration tests. In restricted environments they require loopback listener access. Database integration tests are opt-in with `RUN_PHASE1_DB_TESTS=1` and must use disposable PostgreSQL only.

## Known limitations

- LinkedIn analytics remains capability-gated; publishing access does not imply analytics access.
- Team pricing remains custom and has no fabricated checkout amount.
- Jobs are manually entered; no scraping, crawling, or auto-apply behavior is implemented.
- Provider credentials, production OAuth, Stripe, and deployment infrastructure remain environment configuration rather than checked-in defaults.
