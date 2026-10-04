# Phase 2 Model Gateway

Phase 2 provides the server-only AI execution boundary. Future agents depend on `ModelGateway`; they do not import OpenAI or provider-specific types.

## Provider boundary

`OpenAIResponsesTransport` is the initial adapter and calls `POST /v1/responses` with `store: false` and strict JSON Schema structured output. API keys are read only from server environment variables. The adapter normalizes provider failures and never forwards provider response bodies or credentials in errors.

`FakeModelTransport` is test-only infrastructure. It is deterministic and supports queued successes, usage metadata, retryable failures, non-retryable failures, and cancellation.

## Execution contract

Every gateway call requires an authenticated owner principal, operation, versioned prompt reference, explicitly bound Zod output schema identity/version, and model-policy key. Requests with an idempotency key use the Phase 1 reservation/replay mechanism, scoped by authenticated owner and operation. The gateway:

1. Registers the immutable prompt digest.
2. Creates and starts an owner-scoped `AgentRun`.
3. Checks input-token, hard output-token, time, and estimated-cost budgets.
4. Executes through the configured transport with timeout and bounded retry policy.
5. Parses JSON and validates it against the caller’s Zod schema.
6. Records token usage and estimated cost in `ModelUsage` and `AgentRun`.
7. Records a normalized terminal state using conditional transitions; terminal states cannot be overwritten.

Runs carry a short execution lease and heartbeat timestamps. A modular-monolith recovery task can fail expired `RUNNING` runs as timed out without introducing a distributed worker system.

Raw prompts and responses are not persisted by default. Future agent artifacts must explicitly opt into bounded, redacted persistence.

## Configuration

Model IDs are resolved through `AI_MODEL_DEFAULT` and policy-specific variables such as `AI_MODEL_WRITER`; business code never embeds provider model IDs. Pricing is supplied through `AI_MODEL_PRICING_JSON` and consumed only by the cost estimator. Timeouts, attempts, backoff, token budgets, and cost budgets use the `AI_*` configuration variables described by `aiConfig.ts`.

Input-token budgeting uses a conservative character-based approximation until provider-specific tokenizers are introduced. Model usage values returned by the provider are validated before persistence. Run records are retained as operational audit data; a future retention policy must preserve billing and safety evidence before archival.

## Failure and cancellation semantics

Failures are normalized into configuration, authentication, rate limit, timeout, provider unavailable, invalid request, invalid output, safety/policy, cancelled, or unknown categories. Invalid structured output is not retried. Caller cancellation and owner-scoped gateway cancellation mark the run `CANCELLED`; timeout is retryable within the configured attempt limit. Retryable provider failures use bounded exponential backoff that observes cancellation. Actual provider usage is validated and checked against the configured cost budget before completion.

## Scope boundary

Phase 2 does not register production agent prompts or implement Professional Memory, Research, Topic, Writer, Critic, Revision, orchestration, publishing, scheduling, analytics, billing, or UI behavior.
