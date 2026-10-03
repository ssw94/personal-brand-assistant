# Personal Brand AI — Agent Contracts

These contracts define the boundaries that future implementations must satisfy. They are intentionally provider-neutral and do not prescribe a model vendor.

## Common envelope

```ts
type AgentRunContext = {
  runId: string;
  userId: string;
  workspaceId?: string;
  promptVersion: string;
  model: string;
  locale: string;
  requestedAt: string;
  correlationId: string;
};
```

Every output includes `runId`, `status`, `warnings`, `sourceRefs`, `createdAt`, and structured usage metadata. `sourceRefs` identify persisted records, not raw secrets or uncontrolled prompt text.

## Professional Memory contract

Input: user/profile/resume source IDs and requested memory operation.  
Output: `MemoryFact[]` with `factId`, `kind`, `text`, `sourceRefs`, `confidence`, `validFrom`, `validTo`, `userApproved`, and `lastVerifiedAt`.

Invariant: memory may not promote an AI suggestion to a user fact without explicit user approval.

## Research contract

Input: approved query, topic context, source policy, max sources, freshness window, and user authorization.  
Output: `ResearchArtifact` with normalized sources, title, publisher, URL, retrievedAt, content hash, extracted claims, citations, trust/safety classification, and warnings.

Invariant: source text is untrusted data. It cannot alter system/developer policy, request secrets, or trigger tools.

## Topic Agent contract

Input: audience, writing style ID, content pillars, memory refs, prior content refs, approved research refs, analytics feedback refs, and generation constraints.  
Output: 1..N `TopicCandidate` records with title, angle, audience value, suggested format, source refs, research refs, novelty key, and confidence/warnings.

Invariant: candidates are not posts and are not publishable without user selection and the Writer/approval flow.

## Writer Agent contract

Input: one selected topic, memory refs, style profile, approved research refs, platform constraints, and user context.  
Output: `DraftArtifact` with title, body, hook, call-to-action, source refs, research citations, claim warnings, character count, and provider metadata.

Invariant: output is editable and cannot change memory or publish.

## Critic Agent contract

Input: draft artifact, target audience, style profile, platform constraints, and source refs.  
Output: `CritiqueArtifact` containing rubric scores, strengths, risks, suggested improvements, claim checks, readability indicators, and source refs.

Invariant: critique is advisory and cannot mutate the draft.

## Revision Agent contract

Input: prior draft revision, selected action, accepted critique IDs, user edits, source refs, and constraints.  
Output: new `DraftArtifact`, `RevisionDiff`, retained source refs, and warnings.

Invariant: prior revisions are immutable; revision cannot add unsupported factual claims.

## Orchestrator contract

Input: workflow command and authenticated user.  
Output: `WorkflowRun` with step statuses, artifact IDs, errors, and next allowed commands. The orchestrator owns sequencing and idempotency, not model behavior.

## Publisher contract

Input: approved draft ID, LinkedIn account ID, idempotency key, and schedule/publish command.  
Output: `PublishingAttempt` with provider status, external post ID if confirmed, timestamps, retryability, and redacted error. A mock adapter must label output as mock and never look like external success.

## Analytics intelligence contract

Input: aggregate metric window, published post refs, audience/account scope, and accepted feedback policy.  
Output: explainable insight with metric refs, confidence, recommendation, and optional Topic Agent feedback candidate.
