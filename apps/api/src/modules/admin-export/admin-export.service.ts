import { Inject, Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { prisma } from '@workspace/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { ServerUser } from '../../common/auth/session.service';

const DEFAULT_BATCH_SIZE = 500;
const MAX_BATCH_SIZE = 2000;

export function parseBatchSize(url: string): number {
  const raw = new URL(url).searchParams.get('batchSize');
  const parsed = Number(raw || DEFAULT_BATCH_SIZE);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_BATCH_SIZE;
  }
  return Math.max(100, Math.min(Math.trunc(parsed), MAX_BATCH_SIZE));
}

async function streamEntityArray<T extends { id: string }>(
  write: (value: string) => void,
  name: string,
  batchSize: number,
  getBatch: (cursor: string | null, take: number) => Promise<T[]>,
) {
  write(`"${name}":[`);
  let cursor: string | null = null;
  let isFirst = true;

  while (true) {
    const rows = await getBatch(cursor, batchSize);
    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      if (!isFirst) {
        write(',');
      }
      write(JSON.stringify(row));
      isFirst = false;
    }

    if (rows.length < batchSize) {
      break;
    }

    cursor = rows[rows.length - 1].id;
  }

  write(']');
}

/**
 * VERBATIM port of apps/web/server/routes/admin-export.ts.
 *
 * Hono streamed via a Web `ReadableStream`; here we write cursor-batched JSON
 * directly to the Express `res` (each `controller.enqueue(encode(v))` becomes
 * `res.write(v)`), preserving the exact byte output, header set, batch cursoring,
 * and the ADMIN_EXPORT audit `IssueHistory` row. The admin gate + rate limit are
 * enforced by the controller before this runs.
 */
@Injectable()
export class AdminExportService {
  constructor(@Inject(PrismaService) private readonly prismaService: PrismaService) {}

  async export(url: string, res: Response, user: ServerUser): Promise<void> {
    const batchSize = parseBatchSize(url);

    const [counts, anchorIssue] = await Promise.all([
      Promise.all([
        prisma.user.count(),
        prisma.issue.count(),
        prisma.comment.count(),
        prisma.screenshot.count(),
        prisma.notification.count(),
        prisma.issueHistory.count(),
      ]),
      prisma.issue.findFirst({ select: { id: true }, orderBy: { createdAt: 'asc' } }),
    ]);

    const [usersCount, issuesCount, commentsCount, screenshotsCount, notificationsCount, historyCount] =
      counts;

    if (anchorIssue) {
      await prisma.issueHistory.create({
        data: {
          issueId: anchorIssue.id,
          actorId: user.id,
          eventType: 'UPDATED',
          description: `Admin exported data snapshot (${issuesCount} issues, ${commentsCount} comments, ${notificationsCount} notifications)`,
          metadata: {
            action: 'ADMIN_EXPORT',
            exportedAt: new Date().toISOString(),
            counts: {
              users: usersCount,
              issues: issuesCount,
              comments: commentsCount,
              screenshots: screenshotsCount,
              notifications: notificationsCount,
              history: historyCount,
            },
          },
        },
      });
    }

    const exportedAt = new Date().toISOString();

    // Headers identical to the Hono Response.
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="issue-tracker-export.json"');
    res.setHeader('Cache-Control', 'no-store');

    const write = (value: string) => res.write(value);

    try {
      write('{');
      write(
        `"metadata":${JSON.stringify({
          exportedAt,
          exportedBy: {
            id: user.id,
            role: user.role,
          },
          counts: {
            users: usersCount,
            issues: issuesCount,
            comments: commentsCount,
            screenshots: screenshotsCount,
            notifications: notificationsCount,
            history: historyCount,
          },
          exportMode: 'streamed-batch',
          batchSize,
        })},`,
      );

      await streamEntityArray(write, 'users', batchSize, (cursor, take) =>
        prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { id: 'asc' },
          take,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        }),
      );
      write(',');

      await streamEntityArray(write, 'issues', batchSize, (cursor, take) =>
        prisma.issue.findMany({
          orderBy: { id: 'asc' },
          take,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        }),
      );
      write(',');

      await streamEntityArray(write, 'comments', batchSize, (cursor, take) =>
        prisma.comment.findMany({
          orderBy: { id: 'asc' },
          take,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        }),
      );
      write(',');

      await streamEntityArray(write, 'screenshots', batchSize, (cursor, take) =>
        prisma.screenshot.findMany({
          orderBy: { id: 'asc' },
          take,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        }),
      );
      write(',');

      await streamEntityArray(write, 'notifications', batchSize, (cursor, take) =>
        prisma.notification.findMany({
          orderBy: { id: 'asc' },
          take,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        }),
      );
      write(',');

      await streamEntityArray(write, 'history', batchSize, (cursor, take) =>
        prisma.issueHistory.findMany({
          orderBy: { id: 'asc' },
          take,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        }),
      );
      write('}');

      res.end();
    } catch (error) {
      // Mirror the ReadableStream `controller.error(error)`: abort the response.
      console.error('Admin export streaming failed', error);
      res.destroy(error as Error);
    }
  }
}
