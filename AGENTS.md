# Personal Brand AI — Repository Instructions

Personal Brand AI is an AI SaaS for software engineers and technology professionals. It helps users build an accurate professional profile, create a thoughtful personal brand, prepare career materials, and manage a reviewable LinkedIn content workflow.

## Product and design authority

- Approved UX/product designs are the visual source of truth. Treat provided reference designs as authoritative over existing implementation patterns.
- Do not create generic SaaS UI, generic admin dashboards, or template-looking screens.
- Use Material UI (MUI) as the primary component library.
- Keep one centralized MUI theme/design system for palette, typography, spacing, radius, elevation, components, states, and responsive behavior.
- Prefer reusable components and clear feature boundaries.
- Product decisions belong under `docs/product/`.
- Design decisions belong under `docs/design/`.
- Do not invent pricing, features, plans, or product behavior. If a requirement is unknown, document the gap and ask for a product decision.

## Pricing and entitlements

Pricing must come from the centralized pricing configuration and must not be hardcoded in individual pages, components, or API handlers. The agreed plans are:

| Plan | Price | Included posting usage |
| --- | ---: | --- |
| Free | ₹0 | 3 posts/month |
| Creator | ₹499/month | 15 posts/month |
| Pro | ₹999/month | 30 posts/month |
| Expert | ₹1,999/month | 60 posts/month |
| Team | ₹4,999+/month | Custom usage |

Usage and entitlements must be enforced server-side. A frontend display is not an entitlement.

## Engineering boundaries

- Every feature implementation must be independently testable.
- Run lint, typecheck, tests, and production build before completing a feature.
- Keep secrets server-side. Never expose provider keys, OAuth client secrets, signing secrets, or database credentials to the browser.
- Do not use LinkedIn scraping.
- Use only official/approved LinkedIn APIs and provider-approved OAuth/publishing flows.
- Keep publishing behind explicit user approval and clear status/error states.
- Prefer a modular monolith with clear boundaries; avoid premature microservices.
- Preserve user-owned data authorization and do not invent user facts, credentials, employers, or achievements.
- Do not implement backend behavior merely to make a visual screen appear complete; use clearly marked mock data only when the product decision permits it.

## Required validation and handoff

Before completing work, update the relevant product/design documentation when a decision changes, run the full validation commands, and summarize changed files, known limitations, and test results. Keep unrelated user changes intact.
