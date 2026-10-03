# Personal Brand AI — User Flows

## Onboarding and Professional Memory

1. User signs up, accepts terms, and completes onboarding.
2. User enters or uploads professional information.
3. System extracts candidate facts with provenance.
4. User reviews, edits, approves, or rejects candidates.
5. Approved facts become Professional Memory; source profile facts remain user-controlled.
6. User selects audience, pillars, posting goals, and writing style preferences/examples.

## Research and topic planning

1. User requests ideas or starts from a content pillar.
2. Topic Agent retrieves authorized memory, style, prior content, accepted analytics feedback, and optionally approved research.
3. Research Agent fetches only allowed sources and stores citations/freshness.
4. Topic Agent returns reviewable candidates with rationale and source references.
5. User selects or edits a topic; no candidate is automatically published.

## Generate, critique, revise, approve

1. User selects a topic and starts generation.
2. Writer Agent creates an editable, source-referenced draft.
3. User edits or asks Critic Agent for rubric-based feedback.
4. User selects improvements; Revision Agent creates a new immutable revision.
5. User submits the draft for review and explicitly approves it.
6. Only an approved draft can be scheduled or sent to the publisher.

## LinkedIn publishing

1. User starts OAuth and approves official LinkedIn scopes.
2. Server validates OAuth state/PKCE and stores token material server-side.
3. User sees the confirmed connected profile and publishing eligibility.
4. User schedules or publishes an approved draft.
5. A durable PublishingJob attempts the official API call with an idempotency key.
6. UI displays confirmed external ID or a redacted failure/retry state.

## Calendar and analytics

Calendar supports month/week/day views, drafts, scheduled posts, published posts, failure states, reschedule, cancellation, and post preview. Analytics imports available official metrics, aggregates by period, and displays observed metrics separately from AI recommendations. Analytics Intelligence can produce traceable feedback candidates for Topic Agent.

## Subscription and usage

1. User sees a server-confirmed plan, billing period, allowance, used amount, remaining amount, and renewal status.
2. API checks entitlement and atomically reserves usage before metered AI/publishing work.
3. Stripe signed webhooks update subscription state; the browser cannot grant paid access.
4. Limit errors explain the blocked feature and the server-confirmed next action.
