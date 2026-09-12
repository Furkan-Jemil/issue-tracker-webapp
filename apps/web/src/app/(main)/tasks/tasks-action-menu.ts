"use server";

/**
 * changeIssueStatusQuick — Server Action
 *
 * Changes vs. previous version:
 *   - `revalidatePath` is still called so RSC caches are invalidated on the
 *     server. However, the client NO LONGER calls `router.refresh()` after
 *     this action — the optimistic state in IssueListClient is the live view.
 *     `router.refresh()` is only triggered on error (rollback path) or on
 *     initial hard-navigation.
 *   - Uses the canonical `canTransition` helper from @workspace/shared
 *     instead of a local VALID_TRANSITIONS map, keeping one source of truth
 *     for the workflow state machine.
 *   - Returns the updated status string so the client can confirm the
 *     server-committed value rather than trusting its own optimistic state.
 */

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";
import { createNotification } from "@/lib/notifications";
import { canTransition } from "@workspace/shared";

export type StatusChangeResult =
  | { ok: true; status: string }
  | { ok: false; error: string };

export async function changeIssueStatusQuick(
  issueId: string,
  nextStatus: string,
): Promise<StatusChangeResult> {
  // ── Auth ──────────────────────────────────────────────────────────────
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" };
  }

  // ── Fetch current state ───────────────────────────────────────────────
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { id: true, title: true, status: true, createdBy: true },
  });

  if (!issue) {
    return { ok: false, error: "Issue not found" };
  }

  // ── Validate transition using shared workflow ─────────────────────────
  if (!canTransition(issue.status, nextStatus)) {
    return {
      ok: false,
      error: `Invalid transition: ${issue.status} → ${nextStatus}`,
    };
  }

  // ── Write ─────────────────────────────────────────────────────────────
  await prisma.$transaction(async (tx) => {
    await tx.issue.update({
      where: { id: issue.id },
      data: { status: nextStatus as any },
    });

    await tx.issueHistory.create({
      data: {
        issueId: issue.id,
        actorId: session.user.id,
        eventType: "STATUS_CHANGED",
        description: `Status changed: ${issue.status} → ${nextStatus}`,
        metadata: {
          previousStatus: issue.status,
          newStatus: nextStatus,
          source: "issues-list-quick-action",
        },
      },
    });
  });

  // ── Notify reporter if they are not the actor ─────────────────────────
  if (issue.createdBy !== session.user.id) {
    await createNotification({
      userId: issue.createdBy,
      issueId: issue.id,
      message: `Status of "${issue.title}" changed: ${issue.status} → ${nextStatus}`,
    }).catch(() => {
      // Non-fatal: notification delivery failure must not surface as an error.
    });
  }

  // ── Invalidate RSC cache so hard-navigations see fresh data ───────────
  // Note: client optimistic state does NOT depend on this — it updates
  // immediately. revalidatePath ensures server-rendered pages and search
  // engine crawls reflect the change.
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${issue.id}`);

  return { ok: true, status: nextStatus };
}
