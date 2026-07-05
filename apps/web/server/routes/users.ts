import { Hono } from 'hono'
import prisma from '../../src/lib/prisma'
import { getServerSession } from '../lib/session'

const app = new Hono()

  // GET /api/users — list all users (any authenticated user, for member picker)
  .get('/', async (c) => {
    try {
      const session = (c as any).session || await getServerSession(c.req.raw.headers)
      if (!session?.user) return c.json({ error: 'Unauthorized' }, { status: 401 })

      const users = await prisma.user.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      })
      return c.json(users)
    } catch (error) {
      console.error('GET /api/users error:', error)
      return c.json({ error: 'Internal server error' }, { status: 500 })
    }
  })

  // GET /api/users/profile — current user profile
  .get('/profile', async (c) => {
    try {
      const session = (c as any).session || await getServerSession(c.req.raw.headers)
      if (!session?.user) return c.json({ error: 'Unauthorized' }, { status: 401 })

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { issues: true } },
        },
      })

      if (!user) return c.json({ error: 'Not found' }, { status: 404 })
      return c.json(user)
    } catch (error) {
      console.error('GET /api/users/profile error:', error)
      return c.json({ error: 'Internal server error' }, { status: 500 })
    }
  })

  // PATCH /api/users/profile — update profile name
  .patch('/profile', async (c) => {
    try {
      const session = (c as any).session || await getServerSession(c.req.raw.headers)
      if (!session?.user) return c.json({ error: 'Unauthorized' }, { status: 401 })

      const body = await c.req.json().catch(() => null)
      if (!body || typeof body.name !== 'string' || !body.name.trim()) {
        return c.json({ error: 'Name is required' }, { status: 400 })
      }

      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: { name: body.name.trim() },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { issues: true } },
        },
      })

      return c.json(user)
    } catch (error) {
      console.error('PATCH /api/users/profile error:', error)
      return c.json({ error: 'Internal server error' }, { status: 500 })
    }
  })

export default app
