import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { createNotification } from "@/lib/notifications";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { issueId, content } = await req.json();
  if (!content || !issueId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const comment = await prisma.comment.create({
    data: {
      issueId,
      userId: session.user.id,
      content,
    },
    include: { user: { select: { name: true } } },
  });
  // Add to IssueHistory
  await prisma.issueHistory.create({
    data: {
      issueId,
      actorId: session.user.id,
      eventType: "COMMENTED",
      description: `Comment added by ${session.user.name}`,
    },
  });
  // Notify all participants except the commenter
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      comments: { select: { userId: true } },
      creator: { select: { id: true } },
    },
  });
  const participantIds = new Set([
    ...(issue?.comments.map((c) => c.userId) || []),
    issue?.creator?.id,
  ]);
  participantIds.delete(session.user.id);
  await Promise.all(
    Array.from(participantIds)
      .filter(Boolean)
      .map((userId) =>
        createNotification({
          userId: userId!,
          message: `New comment on issue: ${issue?.title || ""}`,
        }),
      ),
  );
  return NextResponse.json(comment);
}
