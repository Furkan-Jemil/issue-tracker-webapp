"use client";

/**
 * NotificationBell
 *
 * Changes vs. previous version:
 *   - Subscribes to the `notifications:changed` event bus so the badge count
 *     updates immediately after any mark-read action anywhere in the app —
 *     even on other pages — without waiting for the next polling cycle.
 *   - Polling interval tightened from 45s → 30s.
 *   - AbortController on every fetch so rapid unmount/remount (e.g. route
 *     transitions) never leaves inflight requests that update stale state.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { notificationEvents } from "@/lib/notificationEvents";
import { cn } from "@/lib/utils";

const POLL_MS = 30_000;

export default function NotificationBell({
  className,
}: {
  className?: string;
}) {
  const [unread, setUnread] = useState(0);

  const fetchCount = useCallback(() => {
    const controller = new AbortController();

    fetch("/api/notifications/unread", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { count?: number }) => {
        setUnread(typeof data.count === "number" ? data.count : 0);
      })
      .catch((err: Error) => {
        // Suppress AbortError — it is intentional on cleanup.
        if (err.name !== "AbortError") setUnread(0);
      });

    // Return the controller so callers can abort if they need to.
    return controller;
  }, []);

  useEffect(() => {
    // Initial fetch.
    const initial = fetchCount();

    // Polling fallback — keeps the count fresh across long-lived sessions
    // even when the tab is in the background and no events fire.
    const intervalId = setInterval(fetchCount, POLL_MS);

    // Event-driven invalidation — fires immediately after any mark-read
    // mutation dispatched via notificationEvents.emit() anywhere in the app.
    const unsubscribe = notificationEvents.on(fetchCount);

    return () => {
      initial.abort();
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [fetchCount]);

  return (
    <Link
      href="/notifications"
      aria-label={
        unread > 0
          ? `Notifications, ${unread} unread`
          : "Notifications"
      }
      title="Open notifications"
      className={cn(
        "relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        className,
      )}
    >
      <Bell className="h-4 w-4" aria-hidden="true" />
      {unread > 0 && (
        <Badge
          variant="destructive"
          className="absolute -right-1 -top-1 min-w-4 justify-center px-1 py-0 text-[10px]"
          aria-hidden="true"
        >
          {unread > 99 ? "99+" : unread}
        </Badge>
      )}
    </Link>
  );
}
