"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const [error, setError] = useState("");
  const router = useRouter();

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

  async function markAllAsRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    await loadNotifications();
    router.refresh();
  }

  async function markOneAsRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    router.refresh();
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="page-stack">
      <PageHeader
        title="Notifications"
        description="Stay on top of issue updates and assignments."
      />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" onClick={markAllAsRead}>
          Mark all read
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Unread</p>
            <p className="mt-1 text-2xl font-semibold">{unreadCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Total shown</p>
            <p className="mt-1 text-2xl font-semibold">{notifications.length}</p>
          </CardContent>
        </Card>
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
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="p-5">No new notifications.</CardContent>
        </Card>
      ) : (
        <ul aria-live="polite" aria-busy={loading} className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <Link
                href={n.issue ? `/issues/${n.issue.id}` : "#"}
                onClick={() => {
                  if (!n.isRead) {
                    void markOneAsRead(n.id);
                  }
                }}>
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
