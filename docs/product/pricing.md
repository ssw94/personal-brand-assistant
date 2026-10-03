# Personal Brand AI — Pricing and Entitlements

This is the commercial source of truth. Product code must read a centralized server-owned configuration and expose a client-safe projection. No page or component may invent prices, quotas, features, or renewal behavior.

| Plan | Price | AI LinkedIn posts/month | Billing/usage note |
|---|---:|---:|---|
| Free | ₹0 | 3 | No paid entitlement. |
| Creator | ₹499/month | 15 | Individual creator allowance. |
| Pro | ₹999/month | 30 | Professional personal-brand allowance. |
| Expert | ₹1,999/month | 60 | Highest individual allowance. |
| Team | ₹4,999+/month | Custom usage | Team usage is configured by agreement. |

The central plan configuration must define plan ID, display name, currency, amount, billing interval, usage dimensions, feature entitlements, and Team custom-usage behavior. The backend is authoritative for active subscription, period, usage, renewal, and limits.

Required usage dimensions initially include `AI_GENERATION`, `AI_CRITIQUE`, `LINKEDIN_PUBLISH`, and `SCHEDULED_POST`; exact counting semantics must be documented before implementation. A post allowance must not be bypassed by calling a different generation endpoint.

Stripe synchronization, cancellation, renewal, invoices, and failed-payment behavior must be server-side. Until Stripe is implemented, UI must label billing as unavailable and must not grant paid access.
