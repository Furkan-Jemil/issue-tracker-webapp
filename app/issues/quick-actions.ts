"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";
import { createNotification } from "@/lib/notifications";

const VALID_TRANSITIONS: Record<string, string[]> = {
  OPEN: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED"],
  CLOSED: ["OPEN"],
};

export async function changeIssueStatusQuick(issueId: string, status: string) {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: {
      id: true,
      title: true,
      status: true,
      createdBy: true,
    },
  });

  if (!issue) {
    throw new Error("Issue not found");
  }

  const next = String(status || "").trim();
  const allowed = VALID_TRANSITIONS[issue.status] || [];

  if (!allowed.includes(next)) {
    throw new Error("Invalid transition");
  }

  await prisma.$transaction(async (tx) => {
    await tx.issue.update({
      where: { id: issue.id },
      data: { status: next as any },
    });

    await tx.issueHistory.create({
      data: {
        issueId: issue.id,
        actorId: session.user.id,
        eventType: "STATUS_CHANGED",
        description: `Status changed: ${issue.status} -> ${next}`,
        metadata: {
          previousStatus: issue.status,
          newStatus: next,
          source: "issues-list-quick-action",
        },
      },
    });
  });

  if (issue.createdBy !== session.user.id) {
    await createNotification({
      userId: issue.createdBy,
      issueId: issue.id,
      message: `Status of "${issue.title}" changed: ${issue.status} -> ${next}`,
    }).catch(() => {});
  }

  revalidatePath("/issues");
  revalidatePath(`/issues/${issue.id}`);
}
