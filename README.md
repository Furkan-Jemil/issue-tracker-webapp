# Issue Tracker Webapp

[![CI](https://github.com/Furkan-Jemil/issue-tracker-webapp/actions/workflows/ci.yml/badge.svg)](https://github.com/Furkan-Jemil/issue-tracker-webapp/actions/workflows/ci.yml) [![Docker Smoke](https://github.com/Furkan-Jemil/issue-tracker-webapp/actions/workflows/docker-smoke.yml/badge.svg)](https://github.com/Furkan-Jemil/issue-tracker-webapp/actions/workflows/docker-smoke.yml)

This project is built with Next.js (App Router), a Hono API server, TypeScript, Prisma, and PostgreSQL.

## Frameworks And Tech Stack

### Core Framework

- Next.js 15 (`next`) with App Router
- React 19 (`react`, `react-dom`)
- TypeScript 5

### Backend And API

- Hono server (`server/index.ts`) for API routes and auth flows
- Node.js 22 runtime

### Data Layer

- Prisma ORM 7 (`prisma`, `@prisma/client`)
- PostgreSQL (`pg`)

### Authentication And Authorization

- Better Auth (`better-auth`, `@better-auth/infra`)
- Hono auth handlers for sign-in and session resolution
- CASL (`@casl/ability`, `@casl/react`) for access control

### UI And Styling

- Tailwind CSS 3 (`tailwindcss`)
- PostCSS + Autoprefixer
- Radix UI primitives (`@radix-ui/*`)
- CVA (`class-variance-authority`) + `clsx` + `tailwind-merge`

### Charts And Visualization

- Chart.js + `react-chartjs-2`
- Recharts

### File Storage And Uploads

- Vercel Blob (`@vercel/blob`)

### QA / Tooling

- Playwright (E2E)
- TSX (TypeScript script runner)

## Getting Started

- Run `npm install` to install dependencies.
- Copy `.env.example` to `.env` and fill in values.
- If your PostgreSQL URL includes `channel_binding=require`, the app and seed scripts now strip that parameter automatically.
- Run `npx prisma generate`.
- Run `npm run db:check` to verify database connectivity from the CLI.
- Run `npm run db:push` to sync schema (requires a reachable database).
- Run `npm run dev` to start the Next.js frontend.
- Run `npm run server:dev` to start the Hono API server.

For the full local experience, run both in separate terminals.

## Production Build

- Run `npm run build`.
- Run `npm run db:push` during deployment when you need to apply schema changes.
- Run `npm run start`.
- Run `npm run server:start` if you deploy the Hono API server separately.
- Run `docker compose up --build` to start the web app, Hono API, and PostgreSQL together.

## Quality Gate

- Run `npm run qa:phase0` to capture Phase 0 baseline checks at `.tmp-phase0-baseline.json`.
- Run `npm run qa:phase0:e2e` to include Playwright E2E in the baseline capture.
- Run `npm run qa:phases` to generate an automated phase report at `.tmp-phase-qa-report.json`.
- Run `npm run test:e2e` to execute authenticated browser tests (Playwright).
- Run `npm run test:auth-smoke` to execute the HTTP auth smoke test.

Current snapshot (2026-03-23):

- Phase QA gate: Pass
- Authenticated browser E2E: Pass (including admin export, admin bulk role update, and notification mark-one/mark-all flows)
- Hono auth smoke test: Pass

## Structure

- `/app` - Main application routes and pages
- `/public` - Static assets
- `/components` - Reusable React components
- `/lib` - Utility libraries (Prisma, auth, CASL, etc.)
- `/prisma` - Prisma schema and migrations
- `/server` - Hono API server, middleware, and auth handlers
- `/styles` - Global styles (Tailwind, etc.)
- `/proxy.ts` - Route protection and security headers

---

For project requirements and data model details, see:

- `SRS_Issue_Tracking_System.md`
- `database-schema.md`

Schema source of truth:

- Runtime schema: `prisma/schema.prisma`
- Design reference: `database-schema.md`
- `PHASE7_CLOSEOUT.md`
- `PHASE13_CLOSEOUT.md`
- `PHASE14_CLOSEOUT.md`

Migration plan:

- `NEXT_PHASES.md`

Hono auth verification:

- `npm run test:auth-smoke`
- `npm run test`

## Published Images

This repository publishes Docker images to GitHub Container Registry on pushes to `main` and on semantic tags.


Pull example:

```bash
docker pull ghcr.io/Furkan-Jemil/issue-tracker-webapp:web:latest
docker pull ghcr.io/Furkan-Jemil/issue-tracker-webapp:api:latest
```

## Automated Deploy (CI)

The repository includes a GitHub Actions workflow to deploy the published images to a target host using SSH and Docker Compose: `.github/workflows/deploy.yml`.

Required repository secrets for CI deploy:

- `DEPLOY_HOST` — the host or IP to SSH to
- `DEPLOY_USER` — SSH username
- `DEPLOY_KEY` — private SSH key (PEM) with access to the deploy user
- `DEPLOY_PORT` — optional SSH port (defaults to 22)
- `DEPLOY_PATH` — optional path to the compose directory on the host (defaults to `$HOME`)

When the workflow runs it will SSH to the target host, run `docker compose pull` and `docker compose up -d` in the `DEPLOY_PATH` directory.
