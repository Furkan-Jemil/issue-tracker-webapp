"use server";

import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";
import type { IssueStatus } from "@prisma/client";
import {
  parseEnumValue,
  parseIssueType,
  parsePriority,
  parseReportedAtDate,
  parseSeverity,
} from "@/lib/issueValidation";
import { createNotification } from "@/lib/notifications";
import { redirect } from "next/navigation";

function formatRole(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

const VALID_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  OPEN: ["IN_PROGRESS"],
  IN_PROGRESS: ["OPEN", "RESOLVED"],
  RESOLVED: ["IN_PROGRESS", "CLOSED"],
  CLOSED: ["RESOLVED"],
};

export async function updateIssue(issueId: string, formData: FormData) {
  const session = await getAppSession();
  if (!session?.user) {
    redirect("/login");
  }

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) {
    redirect("/tasks");
  }

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = issue.createdBy === session.user.id;
  const canEdit = isAdmin || (isOwner && issue.status === "OPEN");

  if (!canEdit) {
    redirect(`/tasks/${issueId}`);
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawType = formData.get("type");
  const rawPriority = formData.get("priority");
  const rawSeverity = formData.get("severity");
  const urlRaw = String(formData.get("url") ?? "").trim();
  const url = urlRaw.length > 0 ? urlRaw : null;
  const sourceNotesRaw = String(formData.get("sourceNotes") ?? "").trim();
  const sourceNotes = sourceNotesRaw.length > 0 ? sourceNotesRaw : null;
  const assigneeIdRaw = String(formData.get("assigneeId") ?? "").trim();
  const parsedReportedAt = parseReportedAtDate(formData.get("reportedAt"));
  const reportedAt = parsedReportedAt ?? null;

  const type = rawType != null ? parseIssueType(rawType) : null;
  const priority = rawPriority != null ? parsePriority(rawPriority) : null;
  const severity = rawSeverity != null ? parseSeverity(rawSeverity) : null;

  if (!title || !description || !type || !priority || !severity) {
    redirect(`/tasks/${issueId}?error=invalid`);
  }

  let nextStatus: IssueStatus = issue.status;
  let nextAssigneeId: string | null = issue.assigneeId;
  if (isAdmin) {
    const parsed = parseEnumValue(formData.get("status"), [
      "OPEN",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
    ] as const);
    if (parsed) {
      nextStatus = parsed;
    }

    if (assigneeIdRaw.length === 0) {
      nextAssigneeId = null;
    } else {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeIdRaw },
        select: { id: true },
      });
      nextAssigneeId = assignee?.id ?? null;
    }
  }

  const statusChanged = nextStatus !== issue.status;
  const assigneeChanged = nextAssigneeId !== issue.assigneeId;

  if (isAdmin && statusChanged) {
    const allowedTransitions = VALID_TRANSITIONS[issue.status] ?? [];
    if (!allowedTransitions.includes(nextStatus)) {
      redirect(`/tasks/${issueId}?error=invalid-status-transition`);
    }
  }

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
        sourceNotes,
        reportedAt,
        status: nextStatus,
        assigneeId: nextAssigneeId,
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
        metadata: {
          assigneeChanged,
          previousAssigneeId: issue.assigneeId,
          newAssigneeId: nextAssigneeId,
          reportedAt: reportedAt ? reportedAt.toISOString() : null,
          sourceNotes,
        },
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

  if (
    assigneeChanged &&
    nextAssigneeId &&
    nextAssigneeId !== issue.createdBy &&
    nextAssigneeId !== session.user.id
  ) {
    await createNotification({
      userId: nextAssigneeId,
      issueId,
      message: `You were assigned to issue \"${title}\".`,
    }).catch((err) => {
      console.error("Failed to create assignee notification", err);
    });
  }

  redirect(`/tasks/${issueId}`);
}

export async function deleteIssue(issueId: string) {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/tasks");
  }

  await prisma.issue.delete({ where: { id: issueId } });

  redirect("/tasks");
}
