import { Hono } from 'hono'
import prisma from '../../src/lib/prisma'
import { checkRateLimit } from '../middleware/rateLimit'
import { getServerSession } from '../lib/session'

const app = new Hono()
  .get('/', async (c) => {
    try {
      const session = (c as any).session || await getServerSession(c.req.raw.headers)
      if (!session?.user) return c.json({ error: 'Unauthorized' }, { status: 401 })

      const { searchParams } = new URL(c.req.url)
      const parsed = parseInt(searchParams.get('limit') || '50', 10)
      const limit = Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, 100)) : 50

      const notifications = await prisma.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' }, take: limit, include: { issue: { select: { id: true, title: true, status: true } } } })

      return c.json({ notifications })
    } catch (error) {
      console.error('Failed to fetch notifications', error)
      return c.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
  .patch('/', async (c) => {
    try {
      const session = (c as any).session || await getServerSession(c.req.raw.headers)
      if (!session?.user) return c.json({ error: 'Unauthorized' }, { status: 401 })

      const rate = checkRateLimit('notifications:patch-all', session.user.id, 30, 60_000)
      if (rate) return c.json(rate.body, ({ status: rate.status } as any))

      const updateResult = await prisma.notification.updateMany({ where: { userId: session.user.id, isRead: false }, data: { isRead: true } })

      return c.json({ success: true, updatedCount: updateResult.count })
    } catch (error) {
      console.error('Failed to update notifications', error)
      return c.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
  .get('/unread', async (c) => {
    try {
      const session = (c as any).session || await getServerSession(c.req.raw.headers)
      if (!session?.user) return c.json({ error: 'Unauthorized' }, { status: 401 })

      const count = await prisma.notification.count({
        where: { userId: session.user.id, isRead: false },
      })

      return c.json({ count })
    } catch (error) {
      console.error('Failed to get unread notifications count', error)
      return c.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
  .get('/:id', async (c) => {
    try {
      const id = c.req.param('id')
      if (!id || typeof id !== 'string') {
        return c.json({ error: 'Invalid notification id' }, { status: 400 })
      }

      const session = (c as any).session || await getServerSession(c.req.raw.headers)
      if (!session?.user) return c.json({ error: 'Unauthorized' }, { status: 401 })

      const notification = await prisma.notification.findUnique({
        where: { id },
        include: {
          issue: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              severity: true,
              type: true,
              url: true,
              comments: {
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                  id: true,
                  content: true,
                  createdAt: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      role: true,
                    },
                  },
                },
              },
              history: {
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                  id: true,
                  eventType: true,
                  description: true,
                  createdAt: true,
                  actor: {
                    select: {
                      id: true,
                      name: true,
                      role: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (!notification || notification.userId !== session.user.id) {
        return c.json({ error: 'Not found' }, { status: 404 })
      }

      return c.json({ notification })
    } catch (error) {
      console.error('Failed to fetch notification', error)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })
  .patch('/:id', async (c) => {
    try {
      const id = c.req.param('id')
      if (!id || typeof id !== 'string') {
        return c.json({ error: 'Invalid notification id' }, { status: 400 })
      }

      const session = (c as any).session || await getServerSession(c.req.raw.headers)
      if (!session?.user) return c.json({ error: 'Unauthorized' }, { status: 401 })

      const rate = checkRateLimit('notifications:patch-one', session.user.id, 60, 60_000)
      if (rate) return c.json(rate.body, ({ status: rate.status } as any))

      const notif = await prisma.notification.findUnique({ where: { id } })
      if (!notif || notif.userId !== session.user.id) {
        return c.json({ error: 'Not found' }, { status: 404 })
      }

      await prisma.notification.update({ where: { id }, data: { isRead: true } })

      return c.json({ success: true })
    } catch (error) {
      console.error('Failed to update notification', error)
      return c.json({ error: 'Internal server error' }, { status: 500 })
    }
  })

export default app
