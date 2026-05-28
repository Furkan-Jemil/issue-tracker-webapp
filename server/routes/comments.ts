import { Context } from 'hono'
import prisma from '../../lib/prisma'
import { createNotification } from '../../lib/notifications'
import { buildCommentNotificationMessage, shouldNotifyOwnerOnComment } from '../../lib/notificationRules'
import { checkRateLimit } from '../middleware/rateLimit'
import { getServerSession } from '../lib/session'

const MAX_COMMENT_LENGTH = 4000

function formatRole(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase()
}

export async function postComment(c: Context) {
  try {
    const session = await getServerSession(c.req.raw.headers)
    if (!session?.user) return c.json({ error: 'Unauthorized' }, { status: 401 })

    const rate = checkRateLimit('comments:post', session.user.id, 20, 60_000)
    if (rate) return c.json(rate.body, ({ status: rate.status } as any))

    const body = await c.req.json().catch(() => null)
    const issueId = body?.issueId
    const content = body?.content
    if (!content || !issueId || typeof content !== 'string' || typeof issueId !== 'string') return c.json({ error: 'Missing or invalid fields' }, { status: 400 })

    const trimmed = content.trim()
    if (!trimmed) return c.json({ error: 'Comment cannot be empty' }, 400)
    if (trimmed.length > MAX_COMMENT_LENGTH) return c.json({ error: `Comment exceeds ${MAX_COMMENT_LENGTH} characters` }, 400)

    const issueForAccess = await prisma.issue.findUnique({ where: { id: issueId }, select: { id: true, title: true, createdBy: true } })
    if (!issueForAccess) return c.json({ error: 'Issue not found' }, { status: 404 })
    if (session.user.role !== 'ADMIN' && issueForAccess.createdBy !== session.user.id) return c.json({ error: 'Forbidden' }, { status: 403 })

    const comment = await prisma.$transaction(async (tx) => {
      const createdComment = await tx.comment.create({ data: { issueId, userId: session.user.id, content: trimmed }, include: { user: { select: { name: true } } } })

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
