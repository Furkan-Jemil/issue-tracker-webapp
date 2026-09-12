"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/layout/search-input";

export function NotificationsToolbar({
  view,
  query,
  unreadCount,
  onMarkAllRead,
  markAllPending,
}: {
  view: "all" | "unread";
  query: string;
  /** Passed from parent so the tab badge stays in sync with optimistic state. */
  unreadCount: number;
  onMarkAllRead: () => void;
  markAllPending: boolean;
}) {
  const buildHref = (targetView: "all" | "unread") =>
    query
      ? `/notifications?view=${targetView}&q=${encodeURIComponent(query)}`
      : `/notifications?view=${targetView}`;

  return (
    <div className="grid gap-2 border-b border-border/60 bg-muted/20 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <SearchInput
        placeholder="Search notifications (type at least 2 letters)"
        className="w-full max-w-sm"
      />

      <div className="flex flex-wrap items-center justify-end gap-2">
        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-md bg-muted/25 p-1">
          <Button
            asChild
            size="dense"
            variant={view === "all" ? "default" : "ghost"}
            className="h-7 rounded-md px-2 text-xs"
          >
            <Link href={buildHref("all")}>All</Link>
          </Button>

          <Button
            asChild
            size="dense"
            variant={view === "unread" ? "default" : "ghost"}
            className="relative h-7 rounded-md px-2 text-xs"
          >
            <Link href={buildHref("unread")}>
              Unread
              {unreadCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="ml-1.5 h-4 min-w-4 rounded-full px-1 py-0 text-[10px]"
                  aria-label={`${unreadCount} unread`}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              ) : null}
            </Link>
          </Button>
        </div>

        {/* Mark all read */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onMarkAllRead}
          disabled={markAllPending || unreadCount === 0}
          aria-label="Mark all notifications as read"
        >
          {markAllPending ? "Marking…" : "Mark all read"}
        </Button>
      </div>
    </div>
  );
}
