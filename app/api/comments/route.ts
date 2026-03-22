import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth/session";
import { createNotification } from "@/lib/notifications";
import {
  buildCommentNotificationMessage,
  shouldNotifyOwnerOnComment,
} from "@/lib/notificationRules";

function formatRole(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAppSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { issueId, content } = await req.json();
    if (
      !content ||
      !issueId ||
      typeof content !== "string" ||
      typeof issueId !== "string"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid fields" },
        { status: 400 },
      );
    }

    const trimmed = content.trim();
    if (!trimmed) {
      return NextResponse.json(
        { error: "Comment cannot be empty" },
        { status: 400 },
      );
    }

    const issueForAccess = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { id: true, title: true, createdBy: true },
    });
    if (!issueForAccess) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }
    if (
      session.user.role !== "ADMIN" &&
      issueForAccess.createdBy !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const comment = await prisma.comment.create({
      data: {
        issueId,
        userId: session.user.id,
        content: trimmed,
      },
      include: { user: { select: { name: true } } },
    });

    await prisma.issueHistory.create({
      data: {
        issueId,
        actorId: session.user.id,
        eventType: "COMMENTED",
        description: `Comment added by ${session.user.name || "Unknown"} (${formatRole(session.user.role)})`,
      },
    });

    if (shouldNotifyOwnerOnComment(issueForAccess.createdBy, session.user.id)) {
      await createNotification({
        userId: issueForAccess.createdBy,
        issueId,
        message: buildCommentNotificationMessage(issueForAccess.title),
      });
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Failed to create comment", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
