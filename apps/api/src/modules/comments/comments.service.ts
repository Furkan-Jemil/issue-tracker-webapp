import { HttpException, Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { ServerUser } from '../../common/auth/session.service';
import {
  createNotification,
  shouldNotifyOwnerOnComment,
  buildCommentNotificationMessage,
} from '../../common/notifications/notification.util';

export const MAX_COMMENT_LENGTH = 4000;

/**
 * Request schema — reconstructs the effective validation of
 * `omitSystemFields(CommentSchema).pick({issueId, content}).extend({...})` from
 * apps/web/server/routes/comments.ts: issueId (string) + content (trimmed,
 * 1..4000) with the exact same messages. Field order (issueId, content) is
 * preserved so first-error ordering matches.
 */
export const createCommentSchema = z.object({
  issueId: z.string(),
  content: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(MAX_COMMENT_LENGTH, `Comment exceeds ${MAX_COMMENT_LENGTH} characters`),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

function formatRole(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

/**
 * CommentsService — VERBATIM port of the comment-creation logic. Creates the
 * comment and its COMMENTED IssueHistory row in one `$transaction`, then fires
 * the owner notification as a best-effort side-effect (never blocks the response,
 * `.catch` logs), exactly as the Hono handler did.
 */
@Injectable()
export class CommentsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(user: ServerUser, input: CreateCommentInput) {
    const prisma = this.prisma.client;
    const { issueId, content } = input;

    const issueForAccess = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { id: true, title: true, createdBy: true, assigneeId: true },
    });
    if (!issueForAccess) {
      throw new HttpException({ error: 'Issue not found' }, 404);
    }
    if (
      user.role !== 'ADMIN' &&
      issueForAccess.createdBy !== user.id &&
      issueForAccess.assigneeId !== user.id
    ) {
      throw new HttpException({ error: 'Forbidden' }, 403);
    }

    const comment = await prisma.$transaction(async (tx) => {
      const createdComment = await tx.comment.create({
        data: { issueId, userId: user.id, content },
        include: { user: { select: { name: true } } },
      });

      await tx.issueHistory.create({
        data: {
          issueId,
          actorId: user.id,
          eventType: 'COMMENTED',
          description: `Comment added by ${user.name || 'Unknown'} (${formatRole(
            user.role,
          )})`,
        },
      });

      return createdComment;
    });

    if (shouldNotifyOwnerOnComment(issueForAccess.createdBy, user.id)) {
      await createNotification(prisma, {
        userId: issueForAccess.createdBy,
        issueId,
        message: buildCommentNotificationMessage(issueForAccess.title),
      }).catch((notificationError) => {
        console.error('Failed to create comment notification', notificationError);
      });
    }

    return { comment };
  }
}