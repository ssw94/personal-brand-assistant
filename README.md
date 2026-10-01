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
