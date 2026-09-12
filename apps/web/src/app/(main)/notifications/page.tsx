"use client";

/**
 * NotificationsPage
 *
 * Overhaul summary vs. the previous table-based version:
 *   - Feed layout: compact <li> rows replacing a 4-column <Table>.
 *   - Unread indicator: a small dot (●) in primary color, not a "Read/Unread"
 *     badge column — unread items also get a subtle bg tint.
 *   - Relative timestamps via formatRelative() with <time datetime> for a11y.
 *   - Issue title shown as a second line when available.
 *   - Mark-read uses optimistic update + 4.2s debounce with undo, identical
 *     to before but now also emits notificationEvents so the bell badge
 *     updates immediately without waiting for a poll cycle.
 *   - "Mark all read" likewise emits the event.
 *   - No more `router.refresh()` after reads — the optimistic state is the
 *     ground truth; the server write is fire-and-forget with error rollback.
 */

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { NotificationsToolbar } from "@/app/(main)/notifications/notifications-toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { notificationEvents } from "@/lib/notificationEvents";
import { formatRelative, formatAbsolute } from "@/lib/formatRelative";
import { cn } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

// ─── Types ──────────────────────────────────────────────────────────────────

type NotificationItem = {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  issueId: string;
  issue?: {
    id: string;
    title: string;
    status: string;
  } | null;
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") === "unread" ? "unread" : "all";
  const query = searchParams.get("q")?.trim() ?? "";

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(1);
  const [markAllPending, setMarkAllPending] = useState(false);
  const [inlineNotice, setInlineNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Tracks the id of the last item optimistically marked read, so the undo
  // timer can be cancelled and the item can be restored.
  const [undoCandidateId, setUndoCandidateId] = useState<string | null>(null);

  // Map of notificationId → pending setTimeout handle. We keep one timer per
  // item so rapidly clicking multiple rows doesn't cross wires.
  const pendingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const pageSize = DEFAULT_PAGE_SIZE;

  // ── Load ───────────────────────────────────────────────────────────────

  async function loadNotifications() {
    try {
      setLoadError("");
      const res = await fetch("/api/notifications?limit=150");
      if (!res.ok) throw new Error("Failed to load notifications.");
      const data = (await res.json()) as {
        notifications?: NotificationItem[];
      };
      setNotifications(data.notifications ?? []);
      setPage(1);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load notifications.",
      );
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
    // Clean up any pending timers on unmount.
    const timers = pendingTimers.current;
    return () => {
      timers.forEach((id) => clearTimeout(id));
      timers.clear();
    };
  }, []);

  // ── Mark all read ──────────────────────────────────────────────────────

  async function markAllAsRead() {
    setMarkAllPending(true);
    setInlineNotice(null);

    // Optimistic: flip all to read in local state.
    const previousState = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      const res = await fetch("/api/notifications", { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to mark all as read.");
      setInlineNotice({ type: "success", text: "All notifications marked as read." });
      notificationEvents.emit(); // update bell badge immediately
    } catch (err) {
      // Roll back optimistic state on failure.
      setNotifications(previousState);
      setInlineNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to mark all as read.",
      });
    } finally {
      setMarkAllPending(false);
    }
  }

  // ── Mark single read (optimistic + debounced server write + undo) ──────

  function markOneAsRead(id: string) {
    // Cancel any existing timer for this id.
    const existing = pendingTimers.current.get(id);
    if (existing !== undefined) clearTimeout(existing);

    // Optimistic flip.
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUndoCandidateId(id);
    setInlineNotice({ type: "success", text: "Marked as read. Undo?" });

    // Emit now so the bell decrements immediately — don't wait for the
    // debounce timer or the server to confirm.
    notificationEvents.emit();

    // Debounced server write: fires after 4.2s unless undone.
    const timerId = setTimeout(async () => {
      pendingTimers.current.delete(id);
      try {
        const res = await fetch(`/api/notifications/${id}`, {
          method: "PATCH",
        });
        if (!res.ok) throw new Error("Server write failed.");
      } catch {
        // Server write failed: restore local state and re-emit so the bell
        // count goes back up.
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
        );
        notificationEvents.emit();
        setInlineNotice({
          type: "error",
          text: "Could not save read state. Please try again.",
        });
      } finally {
        setUndoCandidateId((current) => (current === id ? null : current));
      }
    }, 4200);

    pendingTimers.current.set(id, timerId);
  }

  function undoMarkRead() {
    if (!undoCandidateId) return;
    const timerId = pendingTimers.current.get(undoCandidateId);
    if (timerId !== undefined) {
      clearTimeout(timerId);
      pendingTimers.current.delete(undoCandidateId);
    }
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === undoCandidateId ? { ...n, isRead: false } : n,
      ),
    );
    // Re-emit: we've restored one unread item so the bell should go up.
    notificationEvents.emit();
    setInlineNotice({ type: "success", text: "Read action undone." });
    setUndoCandidateId(null);
  }

  // ── Derived lists ──────────────────────────────────────────────────────

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const visibleNotifications =
    view === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const filteredNotifications =
    query.length >= 2
      ? visibleNotifications.filter((n) => {
          const haystack =
            `${n.message} ${n.issue?.title ?? ""}`.toLowerCase();
          return haystack.includes(query.toLowerCase());
        })
      : visibleNotifications;

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / pageSize));
  const paginatedNotifications = filteredNotifications.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="page-stack">
      <PageHeader
        title="Notifications"
        description="Stay on top of issue updates and assignments."
      />

      <NotificationsToolbar
        view={view}
        query={query}
        unreadCount={unreadCount}
        onMarkAllRead={markAllAsRead}
        markAllPending={markAllPending}
      />

      {/* Inline action feedback */}
      {inlineNotice ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            inlineNotice.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{inlineNotice.text}</span>
            {undoCandidateId && inlineNotice.type === "success" ? (
              <Button
                type="button"
                size="dense"
                variant="soft"
                onClick={undoMarkRead}
              >
                Undo
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {loadError ? (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {loadError}
        </div>
      ) : null}

      {/* Summary line */}
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {notifications.length} total &middot; {unreadCount} unread
        {filteredNotifications.length !== notifications.length
          ? ` · ${filteredNotifications.length} matching filter`
          : null}
      </p>

      {/* Feed */}
      {loading ? (
        <div
          className="rounded-xl border border-border/70 bg-card p-6 text-center text-sm text-muted-foreground"
          aria-live="polite"
          aria-busy="true"
        >
          Loading notifications…
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-background/60 px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            {view === "unread" ? "No unread notifications" : "No notifications"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {query.length >= 2
              ? `Nothing matches "${query}".`
              : "You're all caught up."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
          <ul
            aria-label="Notification feed"
            aria-live="polite"
            className="divide-y divide-border/50"
          >
            {paginatedNotifications.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "group flex items-start gap-3 px-4 py-3 transition-colors",
                  n.isRead
                    ? "hover:bg-muted/25"
                    : "bg-primary/[0.035] hover:bg-primary/[0.06]",
                )}
              >
                {/* Unread dot */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-[0.4rem] h-2 w-2 shrink-0 rounded-full transition-colors",
                    n.isRead ? "bg-transparent" : "bg-primary",
                  )}
                />

                {/* Content */}
                <div className="min-w-0 flex-1">
                  {/* Message — links to the issue */}
                  <Link
                    href={n.issue ? `/tasks/${n.issue.id}` : "#"}
                    className="block text-sm font-medium leading-snug text-foreground hover:text-primary hover:underline"
                  >
                    {n.message}
                  </Link>

                  {/* Issue title as supporting context */}
                  {n.issue?.title ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {n.issue.title}
                    </p>
                  ) : null}

                  {/* Relative timestamp */}
                  <time
                    dateTime={new Date(n.createdAt).toISOString()}
                    title={formatAbsolute(n.createdAt)}
                    className="mt-1 block text-xs text-muted-foreground"
                  >
                    {formatRelative(n.createdAt)}
                  </time>
                </div>

                {/* Inline action */}
                <div className="shrink-0 pt-0.5">
                  {!n.isRead ? (
                    <button
                      type="button"
                      onClick={() => markOneAsRead(n.id)}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Mark "${n.message}" as read`}
                    >
                      Mark read
                    </button>
                  ) : (
                    <span
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground/50"
                      aria-label="Already read"
                    >
                      Read
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
