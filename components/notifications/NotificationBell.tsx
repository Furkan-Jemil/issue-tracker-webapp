"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const POLL_MS = 45_000;

export default function NotificationBell({ className }: { className?: string }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;

    function load() {
      fetch(`/api/notifications/unread`)
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled) setUnread(data.count || 0);
        })
        .catch(() => {
          if (!cancelled) setUnread(0);
        });
    }

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <Link
      href="/notifications"
      aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
      title="Open notifications"
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:h-8 md:w-8",
        className,
      )}>
      <Bell className="h-4 w-4" />
      {unread > 0 && (
        <Badge
          variant="destructive"
          className="absolute -right-1 -top-1 min-w-4 justify-center px-1 py-0 text-[10px]">
          {unread}
        </Badge>
      )}
    </Link>
  );
}
