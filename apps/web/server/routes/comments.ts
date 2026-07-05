import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import prisma from '../../src/lib/prisma'
import { createNotification } from '../../src/lib/notifications'
import { buildCommentNotificationMessage, shouldNotifyOwnerOnComment } from '../../src/lib/notificationRules'
import { checkRateLimit } from '../middleware/rateLimit'
import { getServerSession } from '../lib/session'
import { CommentSchema } from '../lib/zod'
import { omitSystemFields } from '../lib/zod-helpers'

const MAX_COMMENT_LENGTH = 4000

function formatRole(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase()
}

// Derive request contract from generated base model and extend with custom rules
const createCommentSchema = omitSystemFields(CommentSchema)
  .pick({
    issueId: true,
    content: true,
  })
  .extend({
    content: z
      .string()
      .trim()
      .min(1, 'Comment cannot be empty')
      .max(MAX_COMMENT_LENGTH, `Comment exceeds ${MAX_COMMENT_LENGTH} characters`),
  })

const app = new Hono()
  .post(
    '/',
    zValidator('json', createCommentSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: result.error.issues[0]?.message || 'Invalid input' }, { status: 400 })
      }
    }),
    async (c) => {
      try {
        const session = (c as any).session || await getServerSession(c.req.raw.headers)
        if (!session?.user) return c.json({ error: 'Unauthorized' }, { status: 401 })

        const rate = checkRateLimit('comments:post', session.user.id, 20, 60_000)
        if (rate) return c.json(rate.body, ({ status: rate.status } as any))

        // Read validated data from Hono context
        const { issueId, content } = c.req.valid('json')

        const issueForAccess = await prisma.issue.findUnique({ where: { id: issueId }, select: { id: true, title: true, createdBy: true, assigneeId: true } })
        if (!issueForAccess) return c.json({ error: 'Issue not found' }, { status: 404 })
        if (session.user.role !== 'ADMIN' && issueForAccess.createdBy !== session.user.id && issueForAccess.assigneeId !== session.user.id) return c.json({ error: 'Forbidden' }, { status: 403 })

        const comment = await prisma.$transaction(async (tx) => {
          const createdComment = await tx.comment.create({ data: { issueId, userId: session.user.id, content }, include: { user: { select: { name: true } } } })

          await tx.issueHistory.create({ data: { issueId, actorId: session.user.id, eventType: 'COMMENTED', description: `Comment added by ${session.user.name || 'Unknown'} (${formatRole(session.user.role)})` } })

          return createdComment
        })

        if (shouldNotifyOwnerOnComment(issueForAccess.createdBy, session.user.id)) {
          await createNotification({ userId: issueForAccess.createdBy, issueId, message: buildCommentNotificationMessage(issueForAccess.title) }).catch((notificationError) => {
            console.error('Failed to create comment notification', notificationError)
          })
        }

        return c.json(comment)
      } catch (error) {
        console.error('Failed to create comment', error)
        return c.json({ error: 'Internal server error' }, { status: 500 })
      }
    }
  )

export default app
