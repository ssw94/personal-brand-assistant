# Production Runbook

## Required configuration

- `AUTH_JWT_SECRET` must be at least 32 characters in production and identity headers must remain disabled.
- AI provider credentials and model configuration are server-only. The ModelGateway must be configured before enabling agent routes.
- `RESEARCH_ALLOWED_HOSTS` must contain only approved external research domains.
- LinkedIn publishing requires the approved app credentials, redirect URI, token encryption key, scopes, and API version. The integration uses official LinkedIn APIs only.
- Stripe requires `STRIPE_WEBHOOK_SECRET`; webhook requests are verified against the raw request body.

## Runtime checks

- `/api/health` is a process liveness check.
- `/api/ready` verifies database readiness and should be used by deployment probes.
- The API process recovers stale AI runs and polls durable publishing jobs. Multiple instances are safe because job claims use leases and conditional transitions.

## Failure handling

- A provider failure remains visible as a failed run/attempt; no provider response is treated as success.
- Publishing can be paused by disabling the LinkedIn integration or cancelling queued jobs.
- Stripe events are idempotent by provider event ID. Replayed events are acknowledged without reapplying state.
- Research failures return explicit failed/unavailable states and do not create fabricated sources.

## Release validation

Run typecheck, lint, unit/integration tests, production build, Prisma migration deployment against a disposable database, and Prisma schema parity before release. Keep credentials and production database URLs out of logs and browser bundles.
