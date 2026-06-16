"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/layout/search-input";

export function NotificationsToolbar({
  view,
  query,
  onMarkAllRead,
  markAllPending,
}: {
  view: "all" | "unread";
  query: string;
  onMarkAllRead: () => void;
  markAllPending: boolean;
}) {
  return (
    <div className="grid gap-2 border-b border-border/60 bg-muted/20 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <SearchInput
        placeholder="Search notifications (type at least 2 letters)"
        className="w-full max-w-sm"
      />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="flex items-center gap-1 rounded-md bg-muted/25 p-1">
          <Button
            asChild
            size="dense"
            variant={view === "all" ? "default" : "ghost"}
            className="h-7 rounded-md px-2 text-xs">
            <Link
              href={
                query
                  ? `/notifications?view=all&q=${encodeURIComponent(query)}`
                  : "/notifications?view=all"
              }>
              All
            </Link>
          </Button>
          <Button
            asChild
            size="dense"
            variant={view === "unread" ? "default" : "ghost"}
            className="h-7 rounded-md px-2 text-xs">
            <Link
              href={
                query
                  ? `/notifications?view=unread&q=${encodeURIComponent(query)}`
                  : "/notifications?view=unread"
              }>
              Unread
            </Link>
          </Button>
        </div>
        <Button type="button" size="sm" onClick={onMarkAllRead} disabled={markAllPending}>
          {markAllPending ? "Marking..." : "Mark all read"}
        </Button>
      </div>
    </div>
  );
}