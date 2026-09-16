"use client";

/**
 * NotificationBell — v3: SSE-driven with polling fallback
 *
 * Architecture:
 *   Primary:  EventSource → /api/notifications/stream
 *             The server pushes a `data: {"count": N}` event whenever
 *             createNotification() fires. Badge updates are near-instant.
 *
 *   Fallback: 30s setInterval → /api/notifications/unread
 *             Runs unconditionally. Catches:
 *               - Cross-process notification writes (multi-instance Vercel)
 *               - Mark-read mutations (no bus signal needed — event bus covers
 *                 mark-read via notificationEvents.emit() in the notifications page)
 *               - SSE connection dropouts while reconnecting
 *
 *   Local bus: notificationEvents.on() — fires immediately when the
 *              notifications page marks items as read, so the badge decrements
 *              without waiting for the next poll cycle.
 *
 * SSE reconnect strategy:
 *   - EventSource natively reconnects using the `retry:` hint (5s) sent by
 *     the server.
 *   - We additionally track `sseConnected` state so the bell can show a
 *     subtle "offline" indicator if SSE has been down for > 60s.
 *   - On every successful SSE message we cancel the need to show the offline
 *     indicator.
 *
 * Cleanup:
 *   All subscriptions and timers are cancelled in the useEffect cleanup so
 *   navigating away never leaves dangling EventSource connections.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { notificationEvents } from "@/lib/notificationEvents";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS   = 30_000;
// If SSE has not delivered a message in this window we consider it degraded.
const SSE_OFFLINE_GRACE  = 60_000;

export default function NotificationBell({
  className,
}: {
  className?: string;
}) {
  const [unread, setUnread]           = useState(0);
  const [sseOnline, setSseOnline]     = useState(true);
  const lastSseEventRef               = useRef<number>(Date.now());
  const esRef                         = useRef<EventSource | null>(null);

  // ── Poll fallback ──────────────────────────────────────────────────────

  const fetchCount = useCallback(() => {
    const controller = new AbortController();
    fetch("/api/notifications/unread", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { count?: number }) => {
        setUnread(typeof data.count === "number" ? data.count : 0);
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          // Don't zero out on network error — keep last known count.
        }
      });
    return controller;
  }, []);

  // ── SSE connection ─────────────────────────────────────────────────────

  function connectSSE() {
    // Close any existing connection before opening a new one.
    esRef.current?.close();

    const es = new EventSource("/api/notifications/stream");
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { count?: number };
        if (typeof payload.count === "number") {
          setUnread(payload.count);
          lastSseEventRef.current = Date.now();
          setSseOnline(true);
        }
      } catch {
        // Malformed JSON — ignore.
      }
    };

    es.onerror = () => {
      // EventSource will auto-reconnect using the retry hint from the server.
      // We just mark offline if we haven't heard anything recently.
      const silentMs = Date.now() - lastSseEventRef.current;
      if (silentMs > SSE_OFFLINE_GRACE) {
        setSseOnline(false);
      }
    };

    return es;
  }

  // ── Mount effect ───────────────────────────────────────────────────────

  useEffect(() => {
    // 1. Open SSE stream.
    const es = connectSSE();

    // 2. Initial poll (in case SSE takes a moment to deliver the first event).
    const initialPoll = fetchCount();

    // 3. Fallback polling interval.
    const intervalId = setInterval(fetchCount, POLL_INTERVAL_MS);

    // 4. Local event bus — fires when mark-read mutations happen in this tab.
    const unsubscribeEvents = notificationEvents.on(fetchCount);

    // 5. SSE offline detector — checks every 65s whether we've heard from
    //    the stream recently. If not, marks offline (subtle badge ring change).
    const offlineCheckId = setInterval(() => {
      const silentMs = Date.now() - lastSseEventRef.current;
      setSseOnline(silentMs < SSE_OFFLINE_GRACE);
    }, SSE_OFFLINE_GRACE + 5_000);

    return () => {
      es.close();
      esRef.current = null;
      initialPoll.abort();
      clearInterval(intervalId);
      clearInterval(offlineCheckId);
      unsubscribeEvents();
    };
  }, [fetchCount]); // fetchCount is stable (useCallback with no deps)

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <Link
      href="/notifications"
      aria-label={
        unread > 0
          ? `Notifications, ${unread} unread`
          : "Notifications"
      }
      title={
        sseOnline
          ? "Open notifications (live)"
          : "Open notifications (live updates unavailable — refreshing on a delay)"
      }
      className={cn(
        "relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        className,
      )}
    >
      <Bell className="h-4 w-4" aria-hidden />

      {/* Unread count badge */}
      {unread > 0 && (
        <Badge
          variant="destructive"
          className="absolute -right-1 -top-1 min-w-4 justify-center px-1 py-0 text-[10px]"
          aria-hidden="true"
        >
          {unread > 99 ? "99+" : unread}
        </Badge>
      )}

      {/* SSE offline indicator — a small dot on the bell when the stream
          is degraded, so power users know they're on the polling fallback.
          Invisible when SSE is healthy (which is the overwhelming majority
          of the time). */}
      {!sseOnline && unread === 0 && (
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-card bg-amber-400"
          title="Live updates degraded — using polling fallback"
        />
      )}
    </Link>
  );
}
