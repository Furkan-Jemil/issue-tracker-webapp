# Issue Tracker Webapp

This project is built with Next.js (App Router), TypeScript, Prisma, and PostgreSQL.

## Frameworks And Tech Stack

### Core Framework

- Next.js 15 (`next`) with App Router
- React 19 (`react`, `react-dom`)
- TypeScript 5

### Backend And API

- Next.js Route Handlers (`app/api/**`) for server APIs
- Node.js 22 runtime

### Data Layer

- Prisma ORM 7 (`prisma`, `@prisma/client`)
- PostgreSQL (`pg`)

### Authentication And Authorization

- Better Auth (`better-auth`, `@better-auth/infra`)
- NextAuth (`next-auth`) for auth route integration
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
- Run `npx prisma generate`.
- Run `npm run db:push` to sync schema (requires a reachable database).
- Run `npm run dev` to start the development server.

## Production Build

- Run `npm run build`.
- Run `npm run db:push` during deployment when you need to apply schema changes.
- Run `npm run start`.

## Quality Gate

- Run `npm run qa:phase0` to capture Phase 0 baseline checks at `.tmp-phase0-baseline.json`.
- Run `npm run qa:phase0:e2e` to include Playwright E2E in the baseline capture.
- Run `npm run qa:phases` to generate an automated phase report at `.tmp-phase-qa-report.json`.
- Run `npm run test:e2e` to execute authenticated browser tests (Playwright).

Current snapshot (2026-03-23):

- Phase QA gate: Pass
- Authenticated browser E2E: Pass (including admin export, admin bulk role update, and notification mark-one/mark-all flows)

## Structure

- `/app` - Main application routes and pages
- `/public` - Static assets
- `/components` - Reusable React components
- `/lib` - Utility libraries (Prisma, auth, CASL, etc.)
- `/prisma` - Prisma schema and migrations
- `/styles` - Global styles (Tailwind, etc.)
- `/api` - API route handlers (if not colocated in `/app/api`)
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
