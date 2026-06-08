import './env-setup'
import 'dotenv/config'

import { serve } from '@hono/node-server'
import { randomUUID } from 'node:crypto'

import { Hono } from 'hono'
import { auth } from '../lib/auth'
import prisma from '../lib/prisma'
import bcrypt from 'bcryptjs'
import { authHandler } from './routes/auth'
import { rateLimitMiddleware } from './middleware/rateLimit'
import { loggingMiddleware } from './middleware/logging'
import { corsMiddleware } from './middleware/cors'
import { sessionMiddleware } from './middleware/session'
import { getHealth } from './routes/health'

const app = new Hono()

app.use('*', loggingMiddleware)
app.use('*', corsMiddleware())
app.use('*', sessionMiddleware)

app.get('/health', (c) => c.json({ ok: true }))
app.get('/api/health', async (c) => getHealth(c))

app.get('/api/db-check', rateLimitMiddleware('db-check', 60, 60_000), async (c) => {
  try {
    await prisma.$connect()
    await prisma.$disconnect()
    return c.json({ db: 'ok' })
  } catch (err) {
    return c.json({ db: 'error', message: String(err) }, { status: 500 })
  }
})

// Auth routes are handled centrally by `server/routes/auth.ts` via `authHandler`.

app.all('/api/auth', async (c) => authHandler(c))
app.all('/api/auth/*', async (c) => authHandler(c))

// Mount placeholders for other API groups
import * as adminRoutes from './routes/admin'
import { getAdminExport } from './routes/adminExport'
import * as commentsRoutes from './routes/comments'
import * as dashboardRoutes from './routes/dashboard'
import * as notificationsRoutes from './routes/notifications'
import { uploadHandler } from './routes/upload'

app.get('/api/admin/users', async (c) => adminRoutes.getUsers(c))
app.post('/api/admin/users/bulk-role', async (c) => adminRoutes.postBulkRole(c))
app.get('/api/admin/export', async (c) => getAdminExport(c))

app.post('/api/comments', async (c) => commentsRoutes.postComment(c))

app.get('/api/dashboard/stats', async (c) => dashboardRoutes.getDashboardStats(c))

app.get('/api/notifications', async (c) => notificationsRoutes.getNotifications(c))
app.patch('/api/notifications', async (c) => notificationsRoutes.patchNotifications(c))
app.get('/api/notifications/unread', async (c) => notificationsRoutes.getUnreadNotifications(c))
app.get('/api/notifications/:id', async (c) => notificationsRoutes.getNotificationById(c))
app.patch('/api/notifications/:id', async (c) => notificationsRoutes.patchNotificationById(c))

app.post('/api/upload', async (c) => uploadHandler(c))

const port = Number(process.env.PORT || 4000)
const server = serve({ fetch: app.fetch, port })

export { server }
export default app
