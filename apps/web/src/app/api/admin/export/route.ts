export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth/session";
import { applyRateLimit } from "@/lib/rateLimit";

const DEFAULT_BATCH_SIZE = 500;
const MAX_BATCH_SIZE = 2000;

function parseBatchSize(url: string): number {
  const raw = new URL(url).searchParams.get("batchSize");
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
        write(",");
      }
      write(JSON.stringify(row));
      isFirst = false;
    }

    if (rows.length < batchSize) {
      break;
    }

    cursor = rows[rows.length - 1].id;
  }

  write("]");
}

export async function GET(req: Request) {
  try {
    const rateLimited = applyRateLimit(req, {
      keyPrefix: "admin-export:get",
      max: 5,
      windowMs: 60_000,
    });
    if (rateLimited) {
      return rateLimited;
    }

    const session = await getAppSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const batchSize = parseBatchSize(req.url);

    const [counts, anchorIssue] = await Promise.all([
      Promise.all([
        prisma.user.count(),
        prisma.issue.count(),
        prisma.comment.count(),
        prisma.screenshot.count(),
        prisma.notification.count(),
        prisma.issueHistory.count(),
      ]),
      prisma.issue.findFirst({
        select: { id: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const [
      usersCount,
      issuesCount,
      commentsCount,
      screenshotsCount,
      notificationsCount,
      historyCount,
    ] = counts;

    // Persist a concrete audit entry for each admin export action.
    // IssueHistory requires an issueId, so we anchor this to the first exported issue when available.
    if (anchorIssue) {
      await prisma.issueHistory.create({
        data: {
          issueId: anchorIssue.id,
          actorId: session.user.id,
          eventType: "UPDATED",
          description: `Admin exported data snapshot (${issuesCount} issues, ${commentsCount} comments, ${notificationsCount} notifications)`,
          metadata: {
            action: "ADMIN_EXPORT",
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

    const encoder = new TextEncoder();
    const exportedAt = new Date().toISOString();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const write = (value: string) =>
            controller.enqueue(encoder.encode(value));

          write("{");
          write(
            `"metadata":${JSON.stringify({
              exportedAt,
              exportedBy: {
                id: session.user.id,
                role: session.user.role,
              },
              counts: {
                users: usersCount,
                issues: issuesCount,
                comments: commentsCount,
                screenshots: screenshotsCount,
                notifications: notificationsCount,
                history: historyCount,
              },
              exportMode: "streamed-batch",
              batchSize,
            })},`,
          );

          await streamEntityArray(write, "users", batchSize, (cursor, take) =>
            prisma.user.findMany({
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
              },
              orderBy: { id: "asc" },
              take,
              ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            }),
          );
          write(",");

          await streamEntityArray(write, "issues", batchSize, (cursor, take) =>
            prisma.issue.findMany({
              orderBy: { id: "asc" },
              take,
              ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            }),
          );
          write(",");

          await streamEntityArray(
            write,
            "comments",
            batchSize,
            (cursor, take) =>
              prisma.comment.findMany({
                orderBy: { id: "asc" },
                take,
                ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
              }),
          );
          write(",");

          await streamEntityArray(
            write,
            "screenshots",
            batchSize,
            (cursor, take) =>
              prisma.screenshot.findMany({
                orderBy: { id: "asc" },
                take,
                ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
              }),
          );
          write(",");

          await streamEntityArray(
            write,
            "notifications",
            batchSize,
            (cursor, take) =>
              prisma.notification.findMany({
                orderBy: { id: "asc" },
                take,
                ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
              }),
          );
          write(",");

          await streamEntityArray(write, "history", batchSize, (cursor, take) =>
            prisma.issueHistory.findMany({
              orderBy: { id: "asc" },
              take,
              ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            }),
          );
          write("}");

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition":
          'attachment; filename="issue-tracker-export.json"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Admin export failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
