import { Hono } from 'hono'
import prisma from '../../src/lib/prisma'
import { parseEnumValue } from '../../src/lib/issueValidation'
import { Role } from '@prisma/client'
import { checkRateLimit } from '../middleware/rateLimit'
import { getServerSession } from '../lib/session'

const app = new Hono()
  .get('/users', async (c) => {
    try {
      const session = (c as any).session || await getServerSession(c.req.raw.headers)
      if (!session?.user || session.user.role !== 'ADMIN') {
        return c.json({ users: [] }, { status: 403 })
      }

      const { searchParams } = new URL(c.req.url)
      const search = (searchParams.get('search') || '').trim()
      const role = parseEnumValue(searchParams.get('role'), Object.values(Role))
      const page = Math.max(1, Number(searchParams.get('page') || '1') || 1)
      const pageSizeRaw = Number(searchParams.get('pageSize') || '20') || 20
      const pageSize = Math.min(Math.max(pageSizeRaw, 1), 100)
      const skip = (page - 1) * pageSize

      const where: any = {
        ...(role ? { role } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
          select: { id: true, name: true, email: true, role: true, createdAt: true },
        }),
        prisma.user.count({ where }),
      ])

      return c.json({ users, total, page, pageSize })
    } catch (error) {
      console.error('Failed to list admin users', error)
      return c.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
  .patch('/users/:id/role', async (c) => {
    try {
      const session = (c as any).session || await getServerSession(c.req.raw.headers)
      if (!session?.user || session.user.role !== 'ADMIN') {
        return c.json({ error: 'Forbidden' }, { status: 403 })
      }

      const userId = c.req.param('id')
      const body = await c.req.json().catch(() => null)
      if (!body || typeof body.role !== 'string') {
        return c.json({ error: 'Invalid input' }, { status: 400 })
      }

      const parsedRole = parseEnumValue(body.role, Object.values(Role))
      if (!parsedRole) return c.json({ error: 'Invalid role' }, { status: 400 })

      const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } })
      if (!target) return c.json({ error: 'User not found' }, { status: 404 })

      if (userId === session.user.id && parsedRole !== Role.ADMIN) {
        return c.json({ error: 'Cannot remove your own admin role' }, { status: 400 })
      }

      if (target.role === Role.ADMIN && parsedRole !== Role.ADMIN) {
        const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } })
        if (adminCount <= 1) return c.json({ error: 'At least one admin must remain' }, { status: 400 })
      }

      await prisma.user.update({ where: { id: userId }, data: { role: parsedRole } })
      return c.json({ success: true })
    } catch (error) {
      console.error('Role update failed', error)
      return c.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
  .post('/users/bulk-role', async (c) => {
    try {
      const session = (c as any).session || await getServerSession(c.req.raw.headers)
      if (!session?.user || session.user.role !== 'ADMIN') {
        return c.json({ error: 'Forbidden' }, { status: 403 })
      }

      const rate = checkRateLimit('admin-users-bulk-role:post', session.user.id, 10, 60_000)
      if (rate) return c.json(rate.body, ({ status: rate.status } as any))

      const body = await c.req.json().catch(() => null)
      if (!body || typeof body !== 'object' || Array.isArray(body)) return c.json({ error: 'Invalid input' }, { status: 400 })

      const ids = 'ids' in body ? body.ids : null
      const parsedRole = parseEnumValue('role' in body ? body.role : null, Object.values(Role))
      if (!Array.isArray(ids) || !parsedRole) return c.json({ error: 'Invalid input' }, { status: 400 })

      const uniqueIds = Array.from(new Set(ids.map((id: any) => (typeof id === 'string' ? id.trim() : '')).filter(Boolean)))
      if (uniqueIds.length === 0 || uniqueIds.length > 500) return c.json({ error: 'Invalid ids list' }, { status: 400 })

      const targetUsers = await prisma.user.findMany({ where: { id: { in: uniqueIds } }, select: { id: true, role: true } })
      if (targetUsers.length !== uniqueIds.length) return c.json({ error: 'One or more user IDs do not exist' }, { status: 400 })

      if (uniqueIds.includes(session.user.id) && parsedRole !== Role.ADMIN) {
        return c.json({ error: "Cannot remove your own admin role in bulk update" }, { status: 400 })
      }

      if (parsedRole !== Role.ADMIN) {
        const adminsToDemote = targetUsers.filter((user) => user.role === Role.ADMIN).length
        if (adminsToDemote > 0) {
          const totalAdmins = await prisma.user.count({ where: { role: Role.ADMIN } })
          if (totalAdmins - adminsToDemote < 1) {
            return c.json({ error: 'At least one admin must remain' }, { status: 400 })
          }
        }
      }

      const updateResult = await prisma.user.updateMany({ where: { id: { in: uniqueIds } }, data: { role: parsedRole } })
      if (updateResult.count !== uniqueIds.length) return c.json({ error: 'Bulk update did not apply to all requested users' }, { status: 409 })

      return c.json({ success: true, updatedCount: updateResult.count })
    } catch (error) {
      console.error('Bulk role update failed', error)
      return c.json({ error: 'Internal server error' }, { status: 500 })
    }
  })

export default app
