import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * NotificationsService — GET-only queries ported 1:1 from
 * apps/web/server/routes/notifications.ts. PATCH routes are deferred to Phase 4.
 */
@Injectable()
export class NotificationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  // GET /api/notifications
  async list(userId: string, limit: number) {
    const notifications = await this.prisma.client.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { issue: { select: { id: true, title: true, status: true } } },
    });
    return { notifications };
  }

  // GET /api/notifications/unread
  async unreadCount(userId: string) {
    const count = await this.prisma.client.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  // GET /api/notifications/:id — returns the raw notification (with nested issue)
  // or null. Ownership check is performed by the caller.
  findById(id: string) {
    return this.prisma.client.notification.findUnique({
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
                user: { select: { id: true, name: true, role: true } },
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
                actor: { select: { id: true, name: true, role: true } },
              },
            },
          },
        },
      },
    });
  }

  // PATCH /api/notifications — mark all unread as read for the user.
  async markAllRead(userId: string) {
    const updateResult = await this.prisma.client.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true, updatedCount: updateResult.count };
  }

  // PATCH /api/notifications/:id — lookup for ownership check (caller enforces),
  // returns minimal row or null.
  findOwnership(id: string) {
    return this.prisma.client.notification.findUnique({ where: { id } });
  }

  async markOneRead(id: string) {
    await this.prisma.client.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return { success: true };
  }
}
