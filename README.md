# Personal Brand Assistant

Personal Brand Assistant is a production-minded foundation for helping a software engineer manage their professional profile, resumes, job search, applications, and interview preparation.

## Stack

- `apps/web`: React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query
- `apps/api`: Express, TypeScript, Prisma, PostgreSQL
- `packages/shared`: shared Zod schemas and API contracts

## Requirements

- Node.js 22+
- npm 11+
- PostgreSQL 15+ (or Docker)

## Local development

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

The web app runs at `http://localhost:5173` and the API at `http://localhost:4000`.

The public product experience is available at `http://localhost:5173/`, with centralized plan information at `/pricing`. The existing authenticated workspace dashboard is at `/dashboard`; authentication and onboarding are intentionally separate flows and are not represented by frontend-only identity claims.

For profile persistence, set `VITE_USER_ID` and `VITE_USER_EMAIL` in `apps/web/.env`. These values identify the real user record to use locally; the app does not seed fictional users or profile data.

Local development accepts these identity headers only when `NODE_ENV` is not `production`. Production API requests must use a signed HS256 Bearer JWT with `sub` set to the user ID and an optional `email` claim. Set a strong `AUTH_JWT_SECRET` (and optionally `AUTH_JWT_ISSUER`) on the API host; never put it in a `VITE_*` variable. The frontend currently has no bundled authentication provider, so connect it to your organization’s OIDC/session layer before exposing it to users. Set `AUTH_ALLOW_IDENTITY_HEADERS=false` explicitly in all deployed environments.

The Resume Builder uses the profile as its source of truth. Resume documents store only selected profile IDs, section visibility/order, and resume-specific summary text. Draft edits autosave to the current version; “Save version” creates an immutable numbered version. PDF export can be added later without changing this model.

AI Resume Optimization defaults to the credential-free `safe-mock` provider (`AI_PROVIDER=mock`). The provider contract lives in `apps/api/src/aiResumeProvider.ts`, so a vendor-backed implementation can be added later without changing the optimization API or review UI. Suggestions are never written into original resume facts automatically.

The Application Package workspace generates a concise cover letter, skill match/gap review, interview prompts, and an application checklist from a selected resume and real job description. Generated letters are saved as editable drafts; the selected resume remains unchanged. The provider contract lives in `apps/api/src/aiCoverLetterProvider.ts`. The default provider only derives statements from supplied profile/resume facts and labels gaps as items to review, never as qualifications.

Interview Preparation is available for tracked applications. It generates technical topics, topic categories, resume-based prompts, behavioral prompts, role-specific prompts, and a checklist from the selected job and available resume facts. Every generated item is labeled preparation material rather than a guaranteed interview question. Interview stage, date, notes, and user-authored answers are persisted independently from generated content.

The AI Career Assistant is available from the Career Assistant workspace. It answers questions using the current user’s saved profile, jobs, applications, resumes, and interview preparation. Important answers include expandable evidence showing the underlying records; when a recommendation cannot be confirmed from stored data, the assistant says so. Questions and answers are persisted in `AIConversation` history.

Content Studio is available from the Content Studio workspace. It stores a content strategy, idea backlog, editable drafts, revisions, critique results, and review/approval state. The default `safe-mock` content provider only uses facts already present in the profile and marks critique as critique-only material. Drafts must be reviewed and approved before future scheduling or publishing integrations can act on them.

The publishing endpoint is intentionally provider-based and credential-free in this version. `SafeMockPublishingProvider` records a successful local state transition without contacting LinkedIn or another third party; a real provider should be added only after OAuth, consent, rate limits, and the destination platform’s terms are implemented.

Jobs are currently entered manually. `apps/api/src/jobSourceProvider.ts` defines the future source-provider boundary, while the default provider intentionally performs no scraping, crawling, auto-apply, or other third-party automation.

## Vercel deployment

Use Vercel’s GitHub integration for deployments; no Vercel token is required in GitHub Actions.

1. Connect the GitHub repository to Vercel and create a new project.
2. Set the Vercel project **Root Directory** to `apps/web`.
3. Keep the detected framework as **Vite**. The checked-in `apps/web/vercel.json` runs the workspace build from the repository root, outputs `dist`, and rewrites all SPA routes to `index.html`.
4. Set `VITE_API_URL` in Vercel Environment Variables to the deployed backend API base URL, including `/api` (for example, `https://api.your-domain.com/api`). Do not put database URLs, provider keys, or other backend secrets in `VITE_*` variables.
5. Set `VITE_USER_ID` and `VITE_USER_EMAIL` only if the current identity-header development flow is being used; replace that flow with authenticated identity before exposing the app broadly.
6. Set the Vercel **Production Branch** to `main`. GitHub integration will create production deployments from `main` and preview deployments for pull requests and other branches.
7. Configure the API’s `WEB_ORIGINS` environment variable with the production Vercel URL and any preview URLs that should be allowed, comma-separated. For example: `https://your-app.vercel.app,https://your-preview-domain.vercel.app`.
8. Configure the backend’s database and AI/provider variables on the backend host only. Vercel only needs the public `VITE_API_URL` and other explicitly client-safe values.

To run checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The API includes a multi-stage Docker image at `apps/api/Dockerfile`. Build it from the repository root with `docker build -f apps/api/Dockerfile -t personal-brand-assistant-api .`; run Prisma migrations as a deployment step before starting the container. `docker compose up -d db` is intentionally a local PostgreSQL-only setup.

The API applies security headers, strict production CORS configuration, request-size limits, and in-process rate limits (120 requests/minute globally, 20 requests/minute for assistant/application-package routes, and 30 requests/minute for resume routes). For multiple API instances, replace the in-process limiter with a shared store such as Redis.

## Docker

```bash
docker compose up -d db
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

The initial milestone includes the application shell, navigation, health endpoint, database foundation, shared contracts, and honest empty states. It intentionally does not create AI output or placeholder user/job data.
