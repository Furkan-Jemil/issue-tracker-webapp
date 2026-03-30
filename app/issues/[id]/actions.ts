"use server";

import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";
import type { IssueStatus } from "@prisma/client";
import {
  parseEnumValue,
  parseIssueType,
  parsePriority,
  parseSeverity,
} from "@/lib/issueValidation";
import { createNotification } from "@/lib/notifications";
import { redirect } from "next/navigation";

function formatRole(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

const VALID_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  OPEN: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

export async function updateIssue(issueId: string, formData: FormData) {
  const session = await getAppSession();
  if (!session?.user) {
    redirect("/login");
  }

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) {
    redirect("/issues");
  }

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = issue.createdBy === session.user.id;
  const canEdit = isAdmin || (isOwner && issue.status === "OPEN");

  if (!canEdit) {
    redirect(`/issues/${issueId}`);
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawType = formData.get("type");
  const rawPriority = formData.get("priority");
  const rawSeverity = formData.get("severity");
  const urlRaw = String(formData.get("url") ?? "").trim();
  const url = urlRaw.length > 0 ? urlRaw : null;

  const type = rawType != null ? parseIssueType(rawType) : null;
  const priority = rawPriority != null ? parsePriority(rawPriority) : null;
  const severity = rawSeverity != null ? parseSeverity(rawSeverity) : null;

  if (!title || !description || !type || !priority || !severity) {
    redirect(`/issues/${issueId}?error=invalid`);
  }

  let nextStatus: IssueStatus = issue.status;
  if (isAdmin) {
    const parsed = parseEnumValue(
      formData.get("status"),
      ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const,
    );
    if (parsed) {
      nextStatus = parsed;
    }
  }

  const statusChanged = nextStatus !== issue.status;

  await prisma.$transaction(async (tx) => {
    await tx.issue.update({
      where: { id: issueId },
      data: {
        title,
        description,
        type,
        priority,
        severity,
        url,
        status: nextStatus,
      },
    });

    if (statusChanged) {
      await tx.issueHistory.create({
        data: {
          issueId,
          actorId: session.user.id,
          eventType: "STATUS_CHANGED",
          description: `Status changed: ${issue.status} → ${nextStatus}`,
          metadata: {
            previousStatus: issue.status,
            newStatus: nextStatus,
          },
        },
      });
    }

    await tx.issueHistory.create({
      data: {
        issueId,
        actorId: session.user.id,
        eventType: "UPDATED",
        description: `Issue updated by ${session.user.name || "Unknown"} (${formatRole(session.user.role)})`,
      },
    });
  });

  if (statusChanged && issue.createdBy !== session.user.id) {
    await createNotification({
      userId: issue.createdBy,
      issueId,
      message: `Status of "${issue.title}" changed: ${issue.status} → ${nextStatus}`,
    }).catch((err) => {
      console.error("Failed to create status notification", err);
    });
  }

  redirect(`/issues/${issueId}`);
}

export async function deleteIssue(issueId: string) {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/issues");
  }

  await prisma.issue.delete({ where: { id: issueId } });

  redirect("/issues");
}
