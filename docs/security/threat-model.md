# Personal Brand AI — Threat Model

This threat model covers the target architecture. Current gaps are listed in [`docs/gap-analysis.md`](../gap-analysis.md).

## Assets

- Professional profile, resumes, source documents, memory facts, writing style, drafts, critiques, and private career history.
- LinkedIn OAuth credentials/tokens and external account identifiers.
- AI/provider keys, Stripe secrets, database credentials, webhook secrets, and object-storage credentials.
- Subscription state, entitlement state, usage counters, analytics, and billing records.
- Prompt versions, research content, citations, agent artifacts, and audit trails.

## Trust boundaries

1. Browser ↔ API: browser input and stored client state are untrusted.
2. API ↔ database: services must enforce user/workspace authorization on every query.
3. API ↔ model provider: prompts and outputs may contain sensitive data; provider policy and retention must be explicit.
4. API ↔ research provider/source: retrieved content is untrusted data and may contain instructions.
5. API ↔ LinkedIn: OAuth/account access is external and revocable; provider responses are untrusted until validated.
6. API ↔ Stripe: browser events are untrusted; signed webhook events are authoritative.
7. Worker ↔ job store: jobs may be retried or duplicated; handlers must be idempotent.

## Threats and controls

| Threat | Impact | Required control | Verification |
|---|---|---|---|
| Cross-user record access | Privacy breach | Direct `userId` ownership filters, authorization tests, no client-supplied owner authority. | Negative API tests for every domain. |
| JWT/localStorage theft | Account takeover | Prefer secure, HttpOnly, SameSite session cookies/OIDC; short expiry/rotation; CSP and XSS hygiene. | Auth/session and browser security tests. |
| OAuth CSRF/account linking | Wrong LinkedIn account linked | State, PKCE/nonce, one-time expiry, redirect allowlist, authenticated callback, replay rejection. | OAuth attack fixtures. |
| Provider token leakage | External account compromise | Encrypt at rest or secret references, server-only access, redacted logs, rotation/revocation. | Secret/log scanning and storage tests. |
| Prompt injection in research | Tool/data exfiltration or policy bypass | Treat source text as data, delimit content, no executable instructions, tool allowlist, output validation, source classification. | Injection corpus and tool-policy tests. |
| Unsupported AI claim | Reputation harm | Memory/source refs, claim checks, user approval, immutable source facts, critic warnings. | Grounding evaluation and approval tests. |
| SSRF/malicious research URL | Internal network access | Approved domains/provider fetcher, URL parsing, DNS/IP blocking, timeouts, response limits, no arbitrary browser fetch. | SSRF and source-policy tests. |
| Malicious resume upload | RCE/data loss | MIME/size limits, malware scanning, sandboxed parser, object-store quarantine, no executable processing. | Upload security tests. |
| Stripe forgery | Entitlement fraud | Verify signature against raw body, idempotent event IDs, server-side sync, no browser entitlement trust. | Webhook signature/replay tests. |
| Usage bypass/race | Revenue loss/provider abuse | Atomic server-side reservation/consumption, transaction isolation, idempotency, authoritative plan lookup. | Concurrent usage tests. |
| Duplicate publishing | Spam/reputation harm | Idempotency key, durable job state, provider external ID reconciliation, retry classification. | Worker retry/failure tests. |
| Job poisoning/replay | Repeated side effects | Signed/internal job creation, owner scope, leases, attempt caps, idempotent handlers. | Queue integration tests. |
| Sensitive logs | Privacy/compliance breach | Structured redaction, no raw drafts/tokens/prompts by default, retention policy. | Log snapshot/redaction tests. |

## Security boundaries by phase

- Before AI: authorization, memory provenance, input limits, and secret redaction.
- Before research: source allowlist/policy, SSRF defense, prompt-injection isolation.
- Before publishing: approved state, connected account, entitlement, idempotency, provider confirmation.
- Before analytics feedback: account ownership, metric provenance, privacy aggregation, explainability.
- Before billing launch: signed webhook synchronization, atomic entitlements, auditability.

## Incident handling

Every provider failure and security-sensitive transition should have a correlation ID and redacted audit event. Support must be able to revoke LinkedIn connections, disable a provider, pause publishing jobs, invalidate sessions, and suspend an account's AI usage without editing production data manually.

## Implemented controls in the current backend

- Research URLs require an explicit server-side HTTPS host allowlist, reject credentials/custom ports/redirects, block private and loopback DNS results, cap response size, and classify prompt-injection-like source text.
- Professional Memory candidates retain provenance and require explicit user review before entering verified context.
- AI calls remain behind the provider-neutral ModelGateway with schema validation, retries, cancellation, usage tracking, and redacted failure handling.
- LinkedIn tokens are encrypted at rest, OAuth state and PKCE verifier hashes are one-time and expiring, and publishing requires an approved latest revision plus a confirmed provider identifier.
- Scheduled jobs use durable leases, owner-scoped records, idempotency keys, and bounded polling. Analytics stores only provider-labeled observations.
- Stripe webhooks verify the raw request body and reject duplicate event IDs before applying approved plan mappings.
