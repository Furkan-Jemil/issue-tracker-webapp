Hono server (prototype)

Quick start (development):

1. Ensure project dependencies are installed: `npm install`
2. Start the Next.js frontend as usual: `npm run dev`
3. Start the Hono server (dev): `npm run server:dev`

Notes:
- This is a scaffold for migrating API routes from `app/api/` to a Hono-based server.
- Routes are currently minimal; port your route handlers from `app/api/` into `server/` and reuse `lib/prisma.ts` for database access.
