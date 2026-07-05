// Vercel serverless entrypoint for the Hono API.
// The Vercel project's Root Directory is the repo root, so this file lives at
// <root>/api/. Vercel routes every /api/* request here; hono/vercel's handle()
// converts the Vercel (Fetch) Request into a Hono invocation. The app's routes
// are already namespaced under /api/*, so no path rewriting is needed.
import { handle } from 'hono/vercel'
import app from '../apps/web/server/app'

export const config = {
  runtime: 'nodejs',
}

export default handle(app)
