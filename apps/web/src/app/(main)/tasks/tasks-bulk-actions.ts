"use server";

/**
 * Bulk issue operations — Server Actions
 *
 * All three actions follow the same contract:
 *   1. Authenticate the calling session.
 *   2. Assert ADMIN role (bulk ops are admin-only — they cross ownership
 *      boundaries by design).
 *   3. Restrict the DB write to only the IDs that actually belong to the
 *      caller's visible scope (prevents forged ID injection from the client).
 *   4. Write inside a single transaction with a parallel IssueHistory row
 *      per affected issue.
 *   5. Return { ok: true, affected: number } | { ok: false; error: string }
 *      so the client can display accurate feedback and roll back on failure.
 *
 * revalidatePath is called after every mutation so cached RSC segments
 * are invalidated for hard navigations — client optimistic state does not
 * depend on this.
 */

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";
import { canTransition } from "@workspace/shared";
import { createNotification } from "@/lib/notifications";

// ─── Shared types ────────────────────────────────────────────────────────────

export type BulkResult =
  | { ok: true; affected: number }
  | { ok: false; error: string };

type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type Priority = "LOW" | "MEDIUM" | "HIGH";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VALID_STATUSES = new Set<IssueStatus>([
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
]);

const VALID_PRIORITIES = new Set<Priority>(["LOW", "MEDIUM", "HIGH"]);

async function getAdminSession() {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

/**
 * Intersect client-supplied IDs with issues that actually exist in the DB.
 * Returns only verified IDs to prevent phantom-ID injection.
 */
async function verifyIssueIds(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  // Deduplicate and cap to prevent absurdly large batches.
  const unique = [...new Set(ids)].slice(0, 200);
  const rows = await prisma.issue.findMany({
    where: { id: { in: unique } },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

// ─── batchChangeStatus ────────────────────────────────────────────────────────

/**
 * Changes all listed issues to `nextStatus`.
 *
 * Issues whose current status cannot legally transition to `nextStatus`
 * (per the shared canTransition rule) are silently skipped — the return
 * value reflects only the issues that were actually mutated.
 */
export async function batchChangeStatus(
  issueIds: string[],
  nextStatus: string,
): Promise<BulkResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  if (!VALID_STATUSES.has(nextStatus as IssueStatus)) {
    return { ok: false, error: `Invalid status: ${nextStatus}` };
  }

  const verifiedIds = await verifyIssueIds(issueIds);
  if (verifiedIds.length === 0) return { ok: false, error: "No valid issue IDs" };

  // Fetch current statuses so we can validate transitions and write history.
  const issues = await prisma.issue.findMany({
    where: { id: { in: verifiedIds } },
    select: { id: true, title: true, status: true, createdBy: true },
  });

  // Filter to only issues where the transition is valid.
  const eligible = issues.filter((iss) =>
    canTransition(iss.status, nextStatus),
  );

  if (eligible.length === 0) {
    return { ok: false, error: "No issues can transition to that status" };
  }

  const eligibleIds = eligible.map((e) => e.id);

  await prisma.$transaction(async (tx) => {
    await tx.issue.updateMany({
      where: { id: { in: eligibleIds } },
      data: { status: nextStatus as IssueStatus },
    });

    await tx.issueHistory.createMany({
      data: eligible.map((iss) => ({
        issueId: iss.id,
        actorId: session.user.id,
        eventType: "STATUS_CHANGED" as const,
        description: `Status changed: ${iss.status} → ${nextStatus} (bulk operation)`,
        metadata: {
          previousStatus: iss.status,
          newStatus: nextStatus,
          source: "bulk-action",
        },
      })),
    });
  });

  // Notify reporters who are not the actor (fire-and-forget, non-fatal).
  for (const iss of eligible) {
    if (iss.createdBy !== session.user.id) {
      await createNotification({
        userId: iss.createdBy,
        issueId: iss.id,
        message: `Status of "${iss.title}" changed to ${nextStatus} (bulk update).`,
      }).catch(() => {});
    }
  }

  revalidatePath("/tasks");
  return { ok: true, affected: eligible.length };
}

// ─── batchChangePriority ──────────────────────────────────────────────────────

/**
 * Sets all listed issues to `nextPriority`.
 * No transition validation needed — priority can always change.
 */
export async function batchChangePriority(
  issueIds: string[],
  nextPriority: string,
): Promise<BulkResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  if (!VALID_PRIORITIES.has(nextPriority as Priority)) {
    return { ok: false, error: `Invalid priority: ${nextPriority}` };
  }

  const verifiedIds = await verifyIssueIds(issueIds);
  if (verifiedIds.length === 0) return { ok: false, error: "No valid issue IDs" };

  await prisma.$transaction(async (tx) => {
    await tx.issue.updateMany({
      where: { id: { in: verifiedIds } },
      data: { priority: nextPriority as Priority },
    });

    await tx.issueHistory.createMany({
      data: verifiedIds.map((id) => ({
        issueId: id,
        actorId: session.user.id,
        eventType: "UPDATED" as const,
        description: `Priority set to ${nextPriority} (bulk operation)`,
        metadata: { newPriority: nextPriority, source: "bulk-action" },
      })),
    });
  });

  revalidatePath("/tasks");
  return { ok: true, affected: verifiedIds.length };
}

// ─── batchDeleteIssues ────────────────────────────────────────────────────────

/**
 * Hard-deletes all listed issues. Cascading deletes on the schema will
 * remove comments, attachments, screenshots, history, and notifications.
 *
 * This is the most destructive bulk action — ADMIN-only, verified IDs only,
 * wrapped in a transaction.
 */
export async function batchDeleteIssues(
  issueIds: string[],
): Promise<BulkResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  const verifiedIds = await verifyIssueIds(issueIds);
  if (verifiedIds.length === 0) return { ok: false, error: "No valid issue IDs" };

  await prisma.$transaction(async (tx) => {
    await tx.issue.deleteMany({ where: { id: { in: verifiedIds } } });
  });

  revalidatePath("/tasks");
  return { ok: true, affected: verifiedIds.length };
}
