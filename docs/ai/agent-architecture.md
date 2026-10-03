# Personal Brand AI — Agent Architecture

This is a design contract, not an implementation. No agent classes or fake AI behavior should be added solely because this document exists.

## Principles

- Agents are bounded application services, not UI components.
- Agents receive an explicit input envelope and return a versioned, schema-validated output.
- Agents may read only authorized Professional Memory, approved style, approved research, and workflow context.
- Agents cannot directly publish, change source facts, grant entitlements, or bypass approval.
- Every run records model, prompt version, inputs by reference, output artifact, usage, latency, and outcome.

## Agent responsibilities

### Professional Intelligence / Memory

Normalizes user-approved profile and resume facts, tracks provenance and confidence, and provides retrieval. It does not infer new credentials. User edits are authoritative and memory updates are reviewable.

### Research Agent

Fetches context from approved sources, stores citations/freshness, extracts bounded claims, and marks untrusted text. It does not treat web content as instructions and does not create user facts.

### Topic Agent

Generates candidate ideas from memory, writing style, audience, pillars, prior content, research, and analytics insights. Candidates include rationale and source references and remain unapproved until the user selects or edits them.

### Writer Agent

Creates an editable LinkedIn draft from an approved topic/context bundle. Claims must resolve to source references or be explicitly framed as opinion/question/placeholder for user verification.

### Critic Agent

Evaluates a draft using a stable rubric: hook, clarity, structure, relevance, readability, evidence/claim risk, audience fit, and platform constraints. It produces critique-only output and never silently edits the draft.

### Revision Agent

Applies explicit user-selected changes or accepted critique items. It creates a new revision, preserves prior versions, and returns changed sections plus source references.

### Content Orchestrator

Coordinates agent runs and content state transitions. It does not contain model prompts or provider-specific logic. It creates jobs for long-running steps and records a traceable run graph.

### LinkedIn Publisher

Consumes only an approved draft and an authorized LinkedIn account. It requests official API publication through a provider, records external IDs and attempts, and reports failure without claiming publication.

### Analytics Intelligence

Aggregates approved analytics data into explainable insights and feedback candidates. It must distinguish observed metrics from recommendations and cannot create facts about the user.

## Execution model

1. API validates request, authorization, plan entitlement, and input size.
2. Orchestrator creates an `AgentRun` and either executes a bounded action or enqueues a job.
3. Agent loads references through domain services, not raw cross-domain database access.
4. Model gateway executes a versioned prompt with tool/source policy.
5. Output is schema-validated, safety-checked, persisted as an artifact, and linked to the workflow entity.
6. UI polls/subscribes to run status and renders partial/final/error states.

## Feedback loop

Analytics Intelligence emits a `TopicFeedbackCandidate` containing observed metric windows, supporting post IDs, confidence, and a recommendation. Topic Agent may use only accepted/eligible feedback candidates and must retain the supporting analytics references.
