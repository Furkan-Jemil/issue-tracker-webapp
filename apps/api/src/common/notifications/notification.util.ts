import type { PrismaClient } from '@workspace/database';

/**
 * Notification helpers — VERBATIM ports of apps/web/src/lib/notifications.ts and
 * apps/web/src/lib/notificationRules.ts. `createNotification` takes the prisma
 * client explicitly (rather than importing the singleton) so callers pass
 * `PrismaService.client`.
 */

export async function createNotification(
  prisma: PrismaClient,
  { userId, issueId, message }: { userId: string; issueId: string; message: string },
) {
  return prisma.notification.create({
    data: {
      userId,
      issueId,
      message,
      isRead: false,
    },
  });
}

export function shouldNotifyOwnerOnComment(
  issueOwnerId: string,
  commentAuthorId: string,
): boolean {
  return issueOwnerId !== commentAuthorId;
}

export function buildCommentNotificationMessage(issueTitle: string): string {
  const title = issueTitle.trim() || 'your issue';
  return `New comment on "${title}".`;
}
