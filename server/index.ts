import './env-setup'
import 'dotenv/config'

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import prisma from '../src/lib/prisma'
import { rateLimitMiddleware } from './middleware/rateLimit'
import { loggingMiddleware } from './middleware/logging'
import { corsMiddleware } from './middleware/cors'
import { sessionMiddleware } from './middleware/session'

import healthApp from './routes/health'
import authApp from './routes/auth'
import adminApp from './routes/admin'
import adminExportApp from './routes/admin-export'
import commentsApp from './routes/comments'
import dashboardApp from './routes/dashboard'
import notificationsApp from './routes/notifications'
import uploadApp from './routes/upload'

const app = new Hono()

app.use('*', loggingMiddleware)
app.use('*', corsMiddleware())
app.use('*', sessionMiddleware)

app.get('/health', (c) => c.json({ ok: true }))

app.get('/api/db-check', rateLimitMiddleware('db-check', 60, 60_000), async (c) => {
  try {
    await prisma.$connect()
    await prisma.$disconnect()
    return c.json({ db: 'ok' })
  } catch (err) {
    return c.json({ db: 'error', message: String(err) }, { status: 500 })
  }
})

// Mount Hono Sub-Apps according to Best Practices and RPC method chaining
const apiRoutes = app
  .route('/api/health', healthApp)
  .route('/api/auth', authApp)
  .route('/api/admin', adminApp)
  .route('/api/admin/export', adminExportApp)
  .route('/api/comments', commentsApp)
  .route('/api/dashboard', dashboardApp)
  .route('/api/notifications', notificationsApp)
  .route('/api/upload', uploadApp)

const port = Number(process.env.PORT || 4000)
const server = serve({ fetch: app.fetch, port })

export type AppType = typeof apiRoutes
export { server }
export default app
