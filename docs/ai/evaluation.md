# Personal Brand AI — Evaluation Strategy

Evaluation is required before replacing safe mocks with production model providers. It must measure factual grounding and safety, not only writing quality.

## Evaluation datasets

- Synthetic fixtures for schema, workflow, injection, and authorization tests.
- Consent-controlled, de-identified profile/resume examples covering engineers, architects, managers, and sparse profiles.
- Curated research pages containing prompt injection, unsupported claims, stale facts, and conflicting sources.
- Golden examples reviewed by product/design owners for topic quality, writing style, critique usefulness, and revision fidelity.

Never place real user secrets or private resumes in source control or unmanaged evaluation services.

## Metrics by agent

| Agent | Core measures | Failure thresholds / gate |
|---|---|---|
| Memory | extraction precision, provenance completeness, approval correctness, stale-fact handling | No unapproved AI fact may become authoritative memory. |
| Research | citation coverage, source freshness, source-policy compliance, injection resistance | No source instruction may override policy or trigger unauthorized tools. |
| Topic | novelty, relevance, audience fit, source coverage, duplicate rate | Every candidate must be traceable to allowed context. |
| Writer | factual support, unsupported-claim rate, editability, platform constraints, style adherence | Unsupported factual claims are a release blocker. |
| Critic | rubric agreement, useful-action rate, false-positive rate, critique-only integrity | Critic must not mutate or invent facts. |
| Revision | accepted-change fidelity, fact preservation, diff correctness, regression rate | Existing supported claims and user edits must be preserved. |
| Publisher | idempotency, confirmed external ID, failure classification, retry safety | Never report external success without provider confirmation. |
| Intelligence | metric correctness, explanation quality, recommendation usefulness | Recommendations must cite observed metrics and not overclaim causality. |

## Test layers

1. Contract/schema tests for every input/output.
2. Unit tests for grounding, claim classification, state transitions, authorization, redaction, and idempotency.
3. Provider contract tests with fake HTTP servers and explicit mock mode.
4. Evaluation runs against fixed fixtures on prompt/model changes.
5. Integration tests with PostgreSQL for persistence and job leases.
6. End-to-end tests for the complete approved content pipeline and failure paths.
7. Security tests for prompt injection, SSRF/source policy, OAuth CSRF, token leakage, webhook signatures, and plan bypass.

## Release gates

No production AI provider, research provider, LinkedIn publisher, or analytics intelligence release is complete until schema validation, authorization, grounding, failure behavior, observability, and cost/usage accounting pass. Human review remains required for launch evaluation of generated content.
