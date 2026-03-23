# Issue Tracker Webapp

This project is built with Next.js (App Router), TypeScript, Prisma, and PostgreSQL.

## Getting Started

- Run `npm install` to install dependencies.
- Copy `.env.example` to `.env` and fill in values.
- Run `npx prisma generate`.
- Run `npx prisma db push` to sync schema.
- Run `npm run dev` to start the development server.

## Production Build

- Run `npm run build`.
- Run `npm run start`.

## Quality Gate

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
