import { Hono } from 'hono'
import prisma from '../../src/lib/prisma'
import { getServerSession } from '../lib/session'

const app = new Hono()

  // GET /api/audit-log — list all audit log entries
  .get('/', async (c) => {
    try {
      const session = (c as any).session || await getServerSession(c.req.raw.headers)
      if (!session?.user) return c.json({ error: 'Unauthorized' }, { status: 401 })

      const { searchParams } = new URL(c.req.url)
      const eventFilter = searchParams.get('event') || ''
      const query = searchParams.get('q')?.trim() || ''
      const page = Math.max(1, Number(searchParams.get('page') || '1') || 1)
      const pageSize = Math.min(Math.max(Number(searchParams.get('pageSize') || '50') || 50, 1), 200)
      const skip = (page - 1) * pageSize

      const where: any = {}
      if (eventFilter && eventFilter !== 'ALL') {
        where.eventType = eventFilter
      }
      if (query) {
        where.OR = [
          { description: { contains: query, mode: 'insensitive' as const } },
          { issue: { title: { contains: query, mode: 'insensitive' as const } } },
          { actor: { name: { contains: query, mode: 'insensitive' as const } } },
          { actor: { email: { contains: query, mode: 'insensitive' as const } } },
        ]
      }

      // Non-admin users only see their own audit events
      if (session.user.role !== 'ADMIN') {
        where.actorId = session.user.id
      }

      const [logs, total] = await Promise.all([
        prisma.issueHistory.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
          include: {
            actor: { select: { id: true, name: true, email: true } },
            issue: { select: { id: true, title: true } },
          },
        }),
        prisma.issueHistory.count({ where }),
      ])

      return c.json({ logs, total, page, pageSize })
    } catch (error) {
      console.error('GET /api/audit-log error:', error)
      return c.json({ error: 'Internal server error' }, { status: 500 })
    }
  })

export default app
