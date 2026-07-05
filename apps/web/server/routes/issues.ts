import { Hono } from 'hono'
import { z } from 'zod'
import prisma from '../../src/lib/prisma'
import { CreateIssueSchema, defineAbilitiesFor, canTransition } from '@workspace/shared'
import { getServerSession } from '../lib/session'

// Uploaded-file references (produced by POST /api/upload) that the client may
// attach to a new issue. Validated separately from CreateIssueSchema so the
// shared web schema is untouched.
const UploadedFileSchema = z.object({
  url: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
})

const app = new Hono()

  // GET /api/issues-mobile — list all issues with relations
  .get('/', async (c) => {
    try {
      const session = (c as any).session || await getServerSession(c.req.raw.headers)
      if (!session?.user) return c.json({ error: 'Unauthorized' }, { status: 401 })

      const ability = defineAbilitiesFor({ id: session.user.id, role: session.user.role as any })
      if (!ability.can('read', 'Issue')) return c.json({ error: 'Forbidden' }, { status: 403 })

      // Row-level scoping: admins see everything; everyone else sees only the
      // issues they created or are assigned to. (CASL is coarse — it only gates
      // "can read issues at all"; ownership is enforced here.)
      const isAdmin = session.user.role === 'ADMIN'
      const where = isAdmin
        ? {}
        : { OR: [{ createdBy: session.user.id }, { assigneeId: session.user.id }] }

      const issues = await prisma.issue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
          comments: {
            orderBy: { createdAt: 'asc' },
            include: { user: { select: { id: true, name: true } } },
          },
          screenshots: { orderBy: { order: 'asc' }, select: { id: true, url: true, filename: true, mimeType: true, sizeBytes: true } },
          attachments: { orderBy: { order: 'asc' }, select: { id: true, url: true, filename: true, mimeType: true, sizeBytes: true } },
        },
      })

      return c.json(issues)
    } catch (error) {
      console.error('GET /api/issues-mobile error:', error)
      return c.json({ error: 'Internal server error' }, { status: 500 })
    }
  })

  // POST /api/issues-mobile — create a new issue
  .post('/', async (c) => {
    try {
      const session = (c as any).session || await getServerSession(c.req.raw.headers)
      if (!session?.user) return c.json({ error: 'Unauthorized' }, { status: 401 })

      const ability = defineAbilitiesFor({ id: session.user.id, role: session.user.role as any })
      if (!ability.can('create', 'Issue')) return c.json({ error: 'Forbidden' }, { status: 403 })

      const body = await c.req.json().catch(() => null)
      if (!body || typeof body !== 'object') return c.json({ error: 'Invalid input' }, { status: 400 })

      const result = CreateIssueSchema.safeParse(body)
      if (!result.success) {
        return c.json({ error: 'Validation failed', details: result.error.format() }, { status: 400 })
      }

      // Optional uploaded-file references (from POST /api/upload).
      const screenshots = z.array(UploadedFileSchema).safeParse((body as any).screenshots ?? [])
      const attachments = z.array(UploadedFileSchema).safeParse((body as any).attachments ?? [])
      const screenshotFiles = screenshots.success ? screenshots.data : []
      const attachmentFiles = attachments.success ? attachments.data : []

      const data = result.data
      const issue = await prisma.$transaction(async (tx) => {
        const created = await tx.issue.create({
          data: {
            title: data.title,
            description: data.description,
            type: data.type as any,
            priority: data.priority as any,
            severity: data.severity as any,
            assigneeId: data.assigneeId ?? null,
            url: data.url ?? null,
            createdBy: session.user.id,
            ...(screenshotFiles.length
              ? {
                  screenshots: {
                    create: screenshotFiles.map((f, i) => ({
                      url: f.url,
                      filename: f.filename,
                      mimeType: f.mimeType,
                      sizeBytes: f.sizeBytes,
                      order: i,
                    })),
                  },
                }
              : {}),
            ...(attachmentFiles.length
              ? {
                  attachments: {
                    create: attachmentFiles.map((f, i) => ({
                      url: f.url,
                      filename: f.filename,
                      mimeType: f.mimeType,
                      sizeBytes: f.sizeBytes,
                      order: i,
                      uploaderId: session.user.id,
                    })),
                  },
                }
              : {}),
          },
          include: {
            creator: { select: { id: true, name: true, email: true } },
            assignee: { select: { id: true, name: true, email: true } },
            screenshots: { orderBy: { order: 'asc' }, select: { id: true, url: true, filename: true, mimeType: true, sizeBytes: true } },
            attachments: { orderBy: { order: 'asc' }, select: { id: true, url: true, filename: true, mimeType: true, sizeBytes: true } },
          },
        })

        await tx.issueHistory.create({
          data: {
            issueId: created.id,
            actorId: session.user.id,
            eventType: 'CREATED',
            description: `Issue created by ${session.user.name || 'Unknown'}`,
          },
        })

        return created
      })

      return c.json(issue, { status: 201 })
    } catch (error) {
      console.error('POST /api/issues-mobile error:', error)
      return c.json({ error: 'Internal server error' }, { status: 500 })
    }
  })

  // PATCH /api/issues/:id — update issue fields
  .patch('/:id', async (c) => {
    try {
      const session = (c as any).session || await getServerSession(c.req.raw.headers)
      if (!session?.user) return c.json({ error: 'Unauthorized' }, { status: 401 })

      const ability = defineAbilitiesFor({ id: session.user.id, role: session.user.role as any })
      if (!ability.can('update', 'Issue')) return c.json({ error: 'Forbidden' }, { status: 403 })

      const id = c.req.param('id')
      const body = await c.req.json().catch(() => null)
      if (!body || typeof body !== 'object') return c.json({ error: 'Invalid input' }, { status: 400 })

      const existing = await prisma.issue.findUnique({ where: { id }, select: { id: true, createdBy: true, status: true, assigneeId: true } })
      if (!existing) return c.json({ error: 'Issue not found' }, { status: 404 })
      if (session.user.role !== 'ADMIN' && existing.createdBy !== session.user.id && existing.assigneeId !== session.user.id) {
        return c.json({ error: 'Forbidden' }, { status: 403 })
      }

      const allowedFields = ['title', 'description', 'status', 'priority', 'severity', 'type', 'assigneeId']
      const updateData: Record<string, any> = {}
      for (const field of allowedFields) {
        if (field in body) updateData[field] = body[field]
      }

      if (Object.keys(updateData).length === 0) return c.json({ error: 'No valid fields to update' }, { status: 400 })

      // Enforce the shared status-transition workflow — reject invalid jumps
      // (e.g. OPEN -> RESOLVED) even if the client sends them.
      const statusChanged = 'status' in updateData && updateData.status !== existing.status
      if (statusChanged && !canTransition(existing.status, updateData.status)) {
        return c.json(
          { error: `Invalid status transition: ${existing.status} → ${updateData.status}` },
          { status: 400 },
        )
      }

      const issue = await prisma.$transaction(async (tx) => {
        const updated = await tx.issue.update({
          where: { id },
          data: updateData,
          include: {
            creator: { select: { id: true, name: true, email: true } },
            assignee: { select: { id: true, name: true, email: true } },
          },
        })

        const changes = Object.keys(updateData).map((f) => `${f}: ${JSON.stringify(updateData[f])}`).join(', ')
        await tx.issueHistory.create({
          data: {
            issueId: id,
            actorId: session.user.id,
            eventType: statusChanged ? 'STATUS_CHANGED' : 'UPDATED',
            description: `Issue ${statusChanged ? `status changed to ${updateData.status}` : 'updated'} by ${session.user.name || 'Unknown'}: ${changes}`,
          },
        })

        return updated
      })

      return c.json(issue)
    } catch (error) {
      console.error('PATCH /api/issues/:id error:', error)
      return c.json({ error: 'Internal server error' }, { status: 500 })
    }
  })

  // DELETE /api/issues/:id — delete an issue
  .delete('/:id', async (c) => {
    try {
      const session = (c as any).session || await getServerSession(c.req.raw.headers)
      if (!session?.user) return c.json({ error: 'Unauthorized' }, { status: 401 })

      const ability = defineAbilitiesFor({ id: session.user.id, role: session.user.role as any })
      if (!ability.can('delete', 'Issue')) return c.json({ error: 'Forbidden' }, { status: 403 })

      const id = c.req.param('id')
      const existing = await prisma.issue.findUnique({ where: { id }, select: { id: true, createdBy: true, assigneeId: true } })
      if (!existing) return c.json({ error: 'Issue not found' }, { status: 404 })
      if (session.user.role !== 'ADMIN' && existing.createdBy !== session.user.id && existing.assigneeId !== session.user.id) {
        return c.json({ error: 'Forbidden' }, { status: 403 })
      }

      await prisma.issue.delete({ where: { id } })
      return c.json({ success: true })
    } catch (error) {
      console.error('DELETE /api/issues/:id error:', error)
      return c.json({ error: 'Internal server error' }, { status: 500 })
    }
  })

export default app
