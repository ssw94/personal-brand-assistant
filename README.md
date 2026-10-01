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

For profile persistence, set `VITE_USER_ID` and `VITE_USER_EMAIL` in `apps/web/.env`. These values identify the real user record to use locally; the app does not seed fictional users or profile data.

The Resume Builder uses the profile as its source of truth. Resume documents store only selected profile IDs, section visibility/order, and resume-specific summary text. Draft edits autosave to the current version; “Save version” creates an immutable numbered version. PDF export can be added later without changing this model.

AI Resume Optimization defaults to the credential-free `safe-mock` provider (`AI_PROVIDER=mock`). The provider contract lives in `apps/api/src/aiResumeProvider.ts`, so a vendor-backed implementation can be added later without changing the optimization API or review UI. Suggestions are never written into original resume facts automatically.

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
