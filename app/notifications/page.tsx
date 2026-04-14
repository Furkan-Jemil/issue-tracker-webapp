"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bell, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";

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
  const [inlineNotice, setInlineNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
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
      pendingReadTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
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
      setInlineNotice({ type: "success", text: "All notifications marked as read." });
      router.refresh();
    } catch (err) {
      setInlineNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to mark notifications as read.",
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
    setInlineNotice({ type: "success", text: "Notification marked read. Undo?" });

    const timerId = window.setTimeout(async () => {
      pendingReadTimersRef.current.delete(id);
      try {
        const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
        if (!res.ok) {
          throw new Error("Failed to save notification state.");
        }
      } catch {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
        );
        setInlineNotice({ type: "error", text: "Could not mark notification as read." });
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
  const visibleNotifications =
    view === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="page-stack">
      <PageHeader
        title="Notifications"
        description="Stay on top of issue updates and assignments."
        icon={Bell}
      />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" onClick={markAllAsRead} disabled={markAllPending}>
          {markAllPending ? "Marking..." : "Mark all read"}
        </Button>
      </div>
      {inlineNotice && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-lg border px-3 py-2 text-sm ${
            inlineNotice.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{inlineNotice.text}</span>
            {undoCandidateId && inlineNotice.type === "success" ? (
              <Button type="button" size="dense" variant="soft" onClick={undoMarkRead}>
                Undo
              </Button>
            ) : null}
          </div>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/notifications?view=unread" className="block">
          <Card className="group cursor-pointer border-border/70 bg-card/95 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-ring/50">
            <CardContent className="flex items-center justify-between gap-3 p-3.5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Unread</p>
                <p className="mt-1 text-2xl font-semibold">{unreadCount}</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 group-hover:text-foreground">View unread</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground">
                <Bell className="h-5 w-5" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/notifications?view=all" className="block">
          <Card className="group cursor-pointer border-border/70 bg-card/95 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-ring/50">
            <CardContent className="flex items-center justify-between gap-3 p-3.5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Total shown</p>
                <p className="mt-1 text-2xl font-semibold">{notifications.length}</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 group-hover:text-foreground">View all</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground">
                <ArrowUpRight className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
      {error && (
        <div
          role="alert"
          className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <Card>
          <CardContent className="p-5" aria-live="polite">
            Loading notifications...
          </CardContent>
        </Card>
      ) : visibleNotifications.length === 0 ? (
        <Card>
          <CardContent className="p-5">No notifications for this view.</CardContent>
        </Card>
      ) : (
        <ul aria-live="polite" aria-busy={loading} className="space-y-2">
          {visibleNotifications.map((n) => (
            <li key={n.id}>
              <Link href={n.issue ? `/issues/${n.issue.id}` : "#"}>
                <Card className={n.isRead ? "opacity-85" : "border-primary/30 shadow-sm shadow-primary/10"}>
                  <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                    <CardTitle className="text-base leading-6">{n.message}</CardTitle>
                    <Badge variant={n.isRead ? "outline" : "secondary"} className="mt-0.5">
                      {n.isRead ? "Read" : "Unread"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
                    <div className="text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                    {!n.isRead && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={(event) => {
                          event.preventDefault();
                          void markOneAsRead(n.id);
                        }}>
                        Mark read
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
