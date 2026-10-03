# Personal Brand AI — Product Specification

## Product definition

Personal Brand AI is an AI SaaS for software engineers and technology professionals. It turns a user-owned professional profile, resume, writing style, research context, and performance history into a trustworthy personal-brand publishing workflow and career workspace.

The product must be useful without fabricating facts. User facts remain authoritative; generated content is editable, attributable to sources where applicable, and blocked from publishing until explicit human approval.

## Primary product loop

```text
Professional Profile
→ Professional Memory
→ Writing Style
→ Research Agent
→ Topic Agent
→ Writer Agent
→ Critic Agent
→ Revision Agent
→ Human Approval
→ LinkedIn Publisher
→ Analytics
→ Analytics Intelligence
→ Topic Agent feedback loop
```

The loop is a target product architecture. Safe mocks in the current repository do not count as completed production stages.

## Product principles

1. Truth before polish: never invent a qualification, employer, project, metric, or achievement.
2. User control: AI drafts require review and explicit approval before scheduling or publishing.
3. One source of professional truth: profile and reviewed resume facts feed memory and downstream workflows.
4. Explainable assistance: generated topics, claims, critiques, revisions, and recommendations retain source/context references.
5. Secure provider boundaries: model, research, LinkedIn, Stripe, storage, and email providers are server-side and replaceable.
6. Calm workflow: make state, next action, limits, and failure recovery obvious.

## Product areas

- Professional foundation: profile, resume upload/ingestion, resume builder, experience, education, skills, projects, certifications, achievements.
- Intelligence: Professional Memory, writing style preferences/examples, research, topics, content pillars, strategy, and analytics intelligence.
- Content: AI post generation, drafts, revisions, critique, improvement, approval, calendar, scheduling, publishing history, and analytics.
- Career: jobs, applications, application packages, interview preparation, and grounded career assistant.
- Account: authentication, onboarding, subscription, usage, billing, LinkedIn connection, and settings.

## Content state machine

`DRAFT → REVIEW → APPROVED → SCHEDULED → PUBLISHING → PUBLISHED`

`PUBLISH_FAILED` is a recoverable state. Every transition is server-authorized, persisted, audited, and idempotent. A failed publication may retry through a durable job; it may not silently become published.

## Non-goals and constraints

- No LinkedIn scraping, crawling, auto-apply, or unofficial publishing.
- No browser-authoritative subscription, entitlement, or usage state.
- No direct provider SDK calls from React.
- No automatic mutation of source profile facts from AI output.
- No microservices split until the modular monolith has a demonstrated operational reason to split.
