// Local / Node entrypoint. Boots the Hono app on a real HTTP listener.
// On Vercel the app is served through api/[[...route]].ts (hono/vercel adapter),
// which imports ./app directly and never runs this file.
import { serve } from '@hono/node-server'
import app from './app'

export type { AppType } from './app'

const port = Number(process.env.PORT || 4000)
const host = process.env.HOST || '0.0.0.0'
const server = serve({ fetch: app.fetch, port, hostname: host })

export { server }
export default app
