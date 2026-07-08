import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { ServerUser } from '../../common/auth/session.service';

export type UploadedFile = {
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
};

export type CreateIssueData = {
  title: string;
  description: string;
  type: string;
  priority: string;
  severity: string;
  assigneeId?: string | null;
  url?: string | null;
};

/**
 * IssuesService — VERBATIM port of the Prisma logic in
 * apps/web/server/routes/issues.ts. Authorization (CASL + ownership) and status
 * transition checks live in the controller (matching where the Hono handler
 * performed them); the service owns the queries and the `$transaction` blocks
 * that atomically write the issue AND its IssueHistory audit row.
 */
@Injectable()
export class IssuesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  // GET /api/issues-mobile
  listForUser(user: ServerUser) {
    const isAdmin = user.role === 'ADMIN';
    const where = isAdmin
      ? {}
      : { OR: [{ createdBy: user.id }, { assigneeId: user.id }] };

    return this.prisma.client.issue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, name: true } } },
        },
        screenshots: {
          orderBy: { order: 'asc' },
          select: { id: true, url: true, filename: true, mimeType: true, sizeBytes: true },
        },
        attachments: {
          orderBy: { order: 'asc' },
          select: { id: true, url: true, filename: true, mimeType: true, sizeBytes: true },
        },
      },
    });
  }

  // POST /api/issues-mobile — create issue + CREATED history row atomically.
  async create(
    user: ServerUser,
    data: CreateIssueData,
    screenshotFiles: UploadedFile[],
    attachmentFiles: UploadedFile[],
  ) {
    return this.prisma.client.$transaction(async (tx) => {
      const created = await tx.issue.create({
        data: {
          title: data.title,
          description: data.description,
          type: data.type as any,
          priority: data.priority as any,
          severity: data.severity as any,
          assigneeId: data.assigneeId ?? null,
          url: data.url ?? null,
          createdBy: user.id,
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
                    uploaderId: user.id,
                  })),
                },
              }
            : {}),
        },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
          screenshots: {
            orderBy: { order: 'asc' },
            select: { id: true, url: true, filename: true, mimeType: true, sizeBytes: true },
          },
          attachments: {
            orderBy: { order: 'asc' },
            select: { id: true, url: true, filename: true, mimeType: true, sizeBytes: true },
          },
        },
      });

      await tx.issueHistory.create({
        data: {
          issueId: created.id,
          actorId: user.id,
          eventType: 'CREATED',
          description: `Issue created by ${user.name || 'Unknown'}`,
        },
      });

      return created;
    });
  }

  findForUpdate(id: string) {
    return this.prisma.client.issue.findUnique({
      where: { id },
      select: { id: true, createdBy: true, status: true, assigneeId: true },
    });
  }

  // PATCH /api/issues-mobile/:id — update + STATUS_CHANGED/UPDATED history row.
  async update(
    id: string,
    user: ServerUser,
    updateData: Record<string, any>,
    statusChanged: boolean,
  ) {
    return this.prisma.client.$transaction(async (tx) => {
      const updated = await tx.issue.update({
        where: { id },
        data: updateData,
        include: {
          creator: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      });

      const changes = Object.keys(updateData)
        .map((f) => `${f}: ${JSON.stringify(updateData[f])}`)
        .join(', ');
      await tx.issueHistory.create({
        data: {
          issueId: id,
          actorId: user.id,
          eventType: statusChanged ? 'STATUS_CHANGED' : 'UPDATED',
          description: `Issue ${
            statusChanged ? `status changed to ${updateData.status}` : 'updated'
          } by ${user.name || 'Unknown'}: ${changes}`,
        },
      });

      return updated;
    });
  }

  findForDelete(id: string) {
    return this.prisma.client.issue.findUnique({
      where: { id },
      select: { id: true, createdBy: true, assigneeId: true },
    });
  }

  async delete(id: string) {
    await this.prisma.client.issue.delete({ where: { id } });
    return { success: true };
  }
}
