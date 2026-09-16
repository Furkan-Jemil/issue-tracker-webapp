"use server";

/**
 * Inline single-issue mutation actions
 *
 * Used by InlineBadgeEdit cells in IssueListClient. Separate from
 * tasks-action-menu.ts (status-only, admin) and tasks-bulk-actions.ts
 * (multi-row) so each action surface has a clean, narrow contract.
 *
 * Auth rules:
 *   changeIssuePriorityInline  — ADMIN only (mirrors status change policy)
 *   changeIssueStatusInline    — ADMIN only (re-exported alias for clarity;
 *                                callers can use either this or
 *                                changeIssueStatusQuick from tasks-action-menu)
 *
 * Both return { ok: true } | { ok: false; error: string } so optimistic
 * rollback in the client is straightforward.
 */

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";
import { canTransition } from "@workspace/shared";
import { createNotification } from "@/lib/notifications";

export type InlineResult =
  | { ok: true }
  | { ok: false; error: string };

type Priority = "LOW" | "MEDIUM" | "HIGH";
type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

const VALID_PRIORITIES = new Set<Priority>(["LOW", "MEDIUM", "HIGH"]);
const VALID_STATUSES   = new Set<IssueStatus>(["OPEN","IN_PROGRESS","RESOLVED","CLOSED"]);

// ─── changeIssuePriorityInline ────────────────────────────────────────────────

export async function changeIssuePriorityInline(
  issueId: string,
  nextPriority: string,
): Promise<InlineResult> {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" };
  }

  if (!VALID_PRIORITIES.has(nextPriority as Priority)) {
    return { ok: false, error: `Invalid priority: ${nextPriority}` };
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { id: true, priority: true },
  });
  if (!issue) return { ok: false, error: "Issue not found" };

  // No-op guard — avoid a spurious write when the value didn't change.
  if (issue.priority === nextPriority) return { ok: true };

  await prisma.$transaction(async (tx) => {
    await tx.issue.update({
      where: { id: issueId },
      data: { priority: nextPriority as Priority },
    });
    await tx.issueHistory.create({
      data: {
        issueId,
        actorId: session.user.id,
        eventType: "UPDATED",
        description: `Priority changed: ${issue.priority} → ${nextPriority}`,
        metadata: {
          previousPriority: issue.priority,
          newPriority: nextPriority,
          source: "inline-badge-edit",
        },
      },
    });
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${issueId}`);
  return { ok: true };
}

// ─── changeIssueStatusInline ──────────────────────────────────────────────────

export async function changeIssueStatusInline(
  issueId: string,
  nextStatus: string,
): Promise<InlineResult> {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" };
  }

  if (!VALID_STATUSES.has(nextStatus as IssueStatus)) {
    return { ok: false, error: `Invalid status: ${nextStatus}` };
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { id: true, title: true, status: true, createdBy: true },
  });
  if (!issue) return { ok: false, error: "Issue not found" };

  if (issue.status === nextStatus) return { ok: true };

  if (!canTransition(issue.status, nextStatus)) {
    return {
      ok: false,
      error: `Invalid transition: ${issue.status} → ${nextStatus}`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.issue.update({
      where: { id: issueId },
      data: { status: nextStatus as IssueStatus },
    });
    await tx.issueHistory.create({
      data: {
        issueId,
        actorId: session.user.id,
        eventType: "STATUS_CHANGED",
        description: `Status changed: ${issue.status} → ${nextStatus}`,
        metadata: {
          previousStatus: issue.status,
          newStatus: nextStatus,
          source: "inline-badge-edit",
        },
      },
    });
  });

  if (issue.createdBy !== session.user.id) {
    await createNotification({
      userId: issue.createdBy,
      issueId,
      message: `Status of "${issue.title}" changed: ${issue.status} → ${nextStatus}`,
    }).catch(() => {});
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${issueId}`);
  return { ok: true };
}
