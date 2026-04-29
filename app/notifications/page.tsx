"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationsToolbar } from "@/app/notifications/NotificationsToolbar";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markAllPending, setMarkAllPending] = useState(false);
  const [inlineNotice, setInlineNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [undoCandidateId, setUndoCandidateId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingReadTimersRef = useRef<Map<string, number>>(new Map());

  async function loadNotifications() {
    try {
      setError("");
      const res = await fetch("/api/notifications?limit=50");
      const data = await res.json();
      setNotifications((data.notifications || []) as NotificationItem[]);
    } catch {
      setError("Failed to load notifications.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    return () => {
      pendingReadTimersRef.current.forEach((timerId) =>
        window.clearTimeout(timerId),
      );
      pendingReadTimersRef.current.clear();
    };
  }, []);

  async function markAllAsRead() {
    setMarkAllPending(true);
    setInlineNotice(null);
    try {
      const res = await fetch("/api/notifications", { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to mark notifications as read.");
      }
      await loadNotifications();
      setInlineNotice({
        type: "success",
        text: "All notifications marked as read.",
      });
      router.refresh();
    } catch (err) {
      setInlineNotice({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Failed to mark notifications as read.",
      });
    } finally {
      setMarkAllPending(false);
    }
  }

  async function markOneAsRead(id: string) {
    const existing = pendingReadTimersRef.current.get(id);
    if (existing) {
      window.clearTimeout(existing);
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUndoCandidateId(id);
    setInlineNotice({
      type: "success",
      text: "Notification marked read. Undo?",
    });

    const timerId = window.setTimeout(async () => {
      pendingReadTimersRef.current.delete(id);
      try {
        const res = await fetch(`/api/notifications/${id}`, {
          method: "PATCH",
        });
        if (!res.ok) {
          throw new Error("Failed to save notification state.");
        }
      } catch {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
        );
        setInlineNotice({
          type: "error",
          text: "Could not mark notification as read.",
        });
      } finally {
        setUndoCandidateId((current) => (current === id ? null : current));
        router.refresh();
      }
    }, 4200);

    pendingReadTimersRef.current.set(id, timerId);
  }

  function undoMarkRead() {
    if (!undoCandidateId) return;
    const timerId = pendingReadTimersRef.current.get(undoCandidateId);
    if (timerId) {
      window.clearTimeout(timerId);
      pendingReadTimersRef.current.delete(undoCandidateId);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === undoCandidateId ? { ...n, isRead: false } : n)),
    );
    setInlineNotice({ type: "success", text: "Read action undone." });
    setUndoCandidateId(null);
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const view = searchParams.get("view") === "unread" ? "unread" : "all";
  const query = (searchParams.get("q") || "").trim();
  const queryCharCount = query.length;

  const visibleNotifications =
    view === "unread" ? notifications.filter((n) => !n.isRead) : notifications;
  const filteredNotifications =
    queryCharCount >= 2
      ? visibleNotifications.filter((n) => {
          const haystack = `${n.message} ${n.issue?.title || ""}`.toLowerCase();
          return haystack.includes(query.toLowerCase());
        })
      : visibleNotifications;

  return (
    <div className="page-stack">
      <PageHeader
        title="Notifications"
        description="Stay on top of issue updates and assignments."
      />
      <NotificationsToolbar
        view={view}
        query={query}
        onMarkAllRead={markAllAsRead}
        markAllPending={markAllPending}
      />
      {inlineNotice && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-lg border px-3 py-2 text-sm ${
            inlineNotice.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{inlineNotice.text}</span>
            {undoCandidateId && inlineNotice.type === "success" ? (
              <Button
                type="button"
                size="dense"
                variant="soft"
                onClick={undoMarkRead}>
                Undo
              </Button>
            ) : null}
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Total {notifications.length} | Unread {unreadCount}
      </p>
      {error && (
        <div
          role="alert"
          className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <div
          className="rounded-md bg-muted/20 px-3 py-2 text-sm text-muted-foreground"
          aria-live="polite">
          Loading notifications...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-md bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          No notifications for this view.
        </div>
      ) : (
        <Table
          className="bg-transparent"
          aria-live="polite"
          aria-busy={loading}>
          <caption className="sr-only">Notifications list</caption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Message</TableHead>
              <TableHead scope="col" className="hidden md:table-cell">
                Time
              </TableHead>
              <TableHead scope="col">State</TableHead>
              <TableHead scope="col" className="text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredNotifications.map((n) => (
              <TableRow key={n.id}>
                <TableCell>
                  <Link
                    href={n.issue ? `/issues/${n.issue.id}` : "#"}
                    className="break-words text-primary hover:underline">
                    {n.message}
                  </Link>
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                  {new Date(n.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant={n.isRead ? "outline" : "secondary"}>
                    {n.isRead ? "Read" : "Unread"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {!n.isRead ? (
                    <Button
                      type="button"
                      size="dense"
                      className="px-2 text-xs"
                      onClick={(event) => {
                        event.preventDefault();
                        void markOneAsRead(n.id);
                      }}>
                      Mark read
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
