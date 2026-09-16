"use client";

/**
 * StatusQuickActions
 *
 * Optimistic status update component.
 *
 * Changes vs. previous version:
 *   - `router.refresh()` is REMOVED. The parent IssueListClient manages the
 *     canonical issue list state and receives status changes via the
 *     `onStatusChange` callback.
 *   - React 19 `useOptimistic` drives the displayed status badge inside this
 *     component while the server action is in-flight. On success the optimistic
 *     state is confirmed by the parent. On failure it rolls back.
 *   - The spinner replaces the MoreVertical icon during the transition so the
 *     user has clear feedback that work is happening.
 *   - `disabled` is set on all action buttons while a transition is pending to
 *     prevent double-submits.
 */

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { Loader2, MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MinimalBadge } from "@/app/(main)/tasks/minimal-badge";
import { changeIssueStatusQuick } from "@/app/(main)/tasks/tasks-action-menu";

// ─── Types ───────────────────────────────────────────────────────────────────

export type QuickStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

/**
 * Allowed next states per current state.
 * Mirrors the shared STATUS_TRANSITIONS map but typed as a const here to
 * avoid importing the full shared package into a client bundle.
 */
const NEXT_STATUS: Record<QuickStatus, QuickStatus[]> = {
  OPEN: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["RESOLVED", "OPEN"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: ["OPEN"],
};

function humanizeStatus(status: QuickStatus): string {
  if (status === "IN_PROGRESS") return "In progress";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StatusQuickActions({
  issueId,
  currentStatus,
  editHref,
  allowStatusChange = true,
  allowEdit = true,
  onStatusChange,
}: {
  issueId: string;
  /** The confirmed status from the parent list. */
  currentStatus: QuickStatus;
  editHref?: string;
  allowStatusChange?: boolean;
  allowEdit?: boolean;
  /**
   * Callback fired when the user requests a status change.
   * The parent calls this with (id, nextStatus) to update its own list state.
   * Also receives `null` as nextStatus to signal a rollback.
   */
  onStatusChange?: (
    issueId: string,
    nextStatus: QuickStatus | null,
    previousStatus: QuickStatus,
  ) => void;
}) {
  const options = NEXT_STATUS[currentStatus] ?? [];
  const visibleOptions = allowStatusChange ? options : [];
  const effectiveEditHref = allowEdit ? editHref : undefined;

  // ── React 19 useOptimistic ─────────────────────────────────────────────
  // `optimisticStatus` is displayed immediately. It reverts to `currentStatus`
  // automatically if the transition completes or throws (React resets it when
  // the surrounding transition is no longer pending).
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    currentStatus,
    (_prev: QuickStatus, next: QuickStatus) => next,
  );

  const [isPending, startTransition] = useTransition();

  if (!effectiveEditHref && visibleOptions.length === 0) {
    return null;
  }

  function handleStatusClick(nextStatus: QuickStatus) {
    // Notify parent immediately so the list row re-renders with the new badge.
    onStatusChange?.(issueId, nextStatus, currentStatus);

    startTransition(async () => {
      // Apply optimistic status inside the transition.
      setOptimisticStatus(nextStatus);

      const result = await changeIssueStatusQuick(issueId, nextStatus);

      if (!result.ok) {
        // Server rejected the transition — roll back the parent list.
        onStatusChange?.(issueId, null, currentStatus);
      }
      // On success: parent state is already correct (set on click).
      // revalidatePath on the server will refresh cache for any hard-nav.
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={
            isPending
              ? "Updating status…"
              : `Quick actions for issue ${issueId}`
          }
          title="Quick status actions"
          className="h-8 w-8 rounded-md"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2
              className="h-4 w-4 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          ) : (
            <MoreVertical className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[210px] p-1" align="end">
        {/* Current optimistic status — gives the user orientation */}
        <div className="px-2.5 pb-1.5 pt-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Current status
          </p>
          <MinimalBadge kind="status" value={optimisticStatus} />
        </div>

        {(effectiveEditHref || visibleOptions.length > 0) && (
          <div className="my-1 h-px bg-border/70" />
        )}

        {/* Edit link */}
        {effectiveEditHref ? (
          <PopoverClose asChild>
            <Link
              href={effectiveEditHref}
              className="block rounded-md px-2.5 py-2 text-sm hover:bg-accent"
            >
              Edit issue
            </Link>
          </PopoverClose>
        ) : null}

        {/* Status transition options */}
        {visibleOptions.length > 0 ? (
          <>
            {effectiveEditHref ? (
              <div className="my-1 h-px bg-border/70" />
            ) : null}
            <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Move to
            </p>
            {visibleOptions.map((status) => (
              <PopoverClose asChild key={status}>
                <button
                  type="button"
                  className="block w-full rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                  disabled={isPending}
                  onClick={() => handleStatusClick(status)}
                >
                  {humanizeStatus(status)}
                </button>
              </PopoverClose>
            ))}
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
