import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { ServerUser } from '../../common/auth/session.service';

export type AuditLogQuery = {
  event: string;
  q: string;
  page: number;
  pageSize: number;
};

/**
 * AuditLogService — ports apps/web/server/routes/audit-log.ts (GET /).
 * Non-admins are scoped to their own actions (`where.actorId = user.id`).
 */
@Injectable()
export class AuditLogService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(params: AuditLogQuery, user: ServerUser) {
    const { event, q, page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (event && event !== 'ALL') {
      where.eventType = event;
    }
    if (q) {
      where.OR = [
        { description: { contains: q, mode: 'insensitive' as const } },
        { issue: { title: { contains: q, mode: 'insensitive' as const } } },
        { actor: { name: { contains: q, mode: 'insensitive' as const } } },
        { actor: { email: { contains: q, mode: 'insensitive' as const } } },
      ];
    }

    // Non-admin users only see their own audit events
    if (user.role !== 'ADMIN') {
      where.actorId = user.id;
    }

    const [logs, total] = await Promise.all([
      this.prisma.client.issueHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          actor: { select: { id: true, name: true, email: true } },
          issue: { select: { id: true, title: true } },
        },
      }),
      this.prisma.client.issueHistory.count({ where }),
    ]);

    return { logs, total, page, pageSize };
  }
}
