import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth/session";
import { applyRateLimit } from "@/lib/rateLimit";
import { createNotification } from "@/lib/notifications";
import {
  buildCommentNotificationMessage,
  shouldNotifyOwnerOnComment,
} from "@/lib/notificationRules";

const MAX_COMMENT_LENGTH = 4000;

function formatRole(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAppSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimited = applyRateLimit(req, {
      keyPrefix: "comments:post",
      identifier: session.user.id,
      max: 20,
      windowMs: 60_000,
    });
    if (rateLimited) {
      return rateLimited;
    }

    const body = await req.json().catch(() => null);
    const issueId = body?.issueId;
    const content = body?.content;
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
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `Comment exceeds ${MAX_COMMENT_LENGTH} characters` },
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

    const comment = await prisma.$transaction(async (tx) => {
      const createdComment = await tx.comment.create({
        data: {
          issueId,
          userId: session.user.id,
          content: trimmed,
        },
        include: { user: { select: { name: true } } },
      });

      await tx.issueHistory.create({
        data: {
          issueId,
          actorId: session.user.id,
          eventType: "COMMENTED",
          description: `Comment added by ${session.user.name || "Unknown"} (${formatRole(session.user.role)})`,
        },
      });

      return createdComment;
    });

    if (shouldNotifyOwnerOnComment(issueForAccess.createdBy, session.user.id)) {
      // Notification failures should not block comment persistence.
      await createNotification({
        userId: issueForAccess.createdBy,
        issueId,
        message: buildCommentNotificationMessage(issueForAccess.title),
      }).catch((notificationError) => {
        console.error(
          "Failed to create comment notification",
          notificationError,
        );
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
