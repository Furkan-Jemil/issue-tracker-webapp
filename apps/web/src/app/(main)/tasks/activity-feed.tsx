"use client";

/**
 * ActivityFeed — Unified chronological stream of user comments and system
 * history events for an issue.
 *
 * Design:
 *   - Top: collapsible "Add a note…" composer.
 *   - Stream: a single vertical timeline where comments and system events
 *     are interleaved in chronological order.
 *   - User comments: avatar circle + name + relative time + bubble.
 *   - System events: compact single-line entry with icon, muted text, and
 *     relative time — no outer card wrapper.
 *   - Vertical connector line via CSS before pseudo-element on each list item.
 */

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  Clock,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FeedComment = {
  id?: string;
  content: string;
  createdAt?: string | Date;
  user?: { name: string | null } | null;
};

export type FeedHistoryEntry = {
  id: string;
  eventType: string;
  description: string;
  createdAt: Date | string;
  metadata?: unknown;
  actor?: { name: string | null } | null;
};

type FeedItem =
  | { kind: "comment"; data: FeedComment; sortKey: number }
  | { kind: "event"; data: FeedHistoryEntry; sortKey: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(date: string | Date | number): string {
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  if (diff < 0) return "just now";
  const seconds = Math.floor(diff / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86_400_000);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function formatCommentDate(d: string | Date | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}, ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
  );
}

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}

function extractStatusDiff(
  metadata: unknown,
): { from: string; to: string } | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const obj = metadata as Record<string, unknown>;
  const from = typeof obj.previousStatus === "string" ? obj.previousStatus : null;
  const to   = typeof obj.newStatus === "string" ? obj.newStatus : null;
  if (!from || !to) return null;
  return { from, to };
}

function humaniseStatus(s: string): string {
  if (s === "IN_PROGRESS") return "In progress";
  return s.charAt(0) + s.slice(1).toLowerCase();
}

// ─── Event icon map ───────────────────────────────────────────────────────────

type LucideIcon = React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

const EVENT_ICON: Record<string, { Icon: LucideIcon; color: string; label: string }> = {
  CREATED: {
    Icon: Plus,
    color: "text-zinc-500 dark:text-zinc-400",
    label: "Created",
  },
  STATUS_CHANGED: {
    Icon: RefreshCw,
    color: "text-blue-500 dark:text-blue-400",
    label: "Status changed",
  },
  UPDATED: {
    Icon: Pencil,
    color: "text-zinc-400 dark:text-zinc-500",
    label: "Updated",
  },
  COMMENTED: {
    Icon: MessageSquare,
    color: "text-zinc-400 dark:text-zinc-500",
    label: "Comment",
  },
};

const FALLBACK_EVENT = {
  Icon: Clock,
  color: "text-zinc-400 dark:text-zinc-500",
  label: "Activity",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function CommentItem({ comment, isLast }: { comment: FeedComment; isLast: boolean }) {
  const name   = comment.user?.name || "Anonymous";
  const avatar = initials(comment.user?.name);
  const rel    = comment.createdAt ? formatRelative(comment.createdAt) : "";

  return (
    <li
      className={cn(
        "relative flex gap-3",
        !isLast && "pb-5 before:absolute before:left-[13px] before:top-7 before:h-[calc(100%-1.25rem)] before:w-px before:bg-border/40",
      )}
    >
      {/* Avatar */}
      <div
        aria-hidden="true"
        className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/50 bg-muted text-[10px] font-semibold uppercase text-muted-foreground"
      >
        {avatar}
      </div>

      {/* Bubble */}
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-xs font-semibold text-foreground">{name}</span>
          <time
            dateTime={comment.createdAt ? new Date(comment.createdAt).toISOString() : ""}
            title={comment.createdAt ? formatCommentDate(comment.createdAt) : ""}
            className="font-mono text-[10px] text-muted-foreground/70"
          >
            {rel}
          </time>
        </div>
        <div className="mt-1.5 rounded-lg rounded-tl-none border border-border/50 bg-muted/20 px-3 py-2.5">
          <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>
      </div>
    </li>
  );
}

function EventItem({ entry, isLast }: { entry: FeedHistoryEntry; isLast: boolean }) {
  const cfg       = EVENT_ICON[entry.eventType] ?? FALLBACK_EVENT;
  const { Icon }  = cfg;
  const actorName = entry.actor?.name ?? "System";
  const rel       = formatRelative(entry.createdAt);

  const statusDiff =
    entry.eventType === "STATUS_CHANGED" ? extractStatusDiff(entry.metadata) : null;

  return (
    <li
      className={cn(
        "relative flex items-start gap-3",
        !isLast && "pb-4 before:absolute before:left-[13px] before:top-6 before:h-[calc(100%-1rem)] before:w-px before:bg-border/30",
      )}
    >
      {/* Icon circle — smaller than comment avatar to create visual hierarchy */}
      <div
        aria-hidden="true"
        className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/60"
      >
        <Icon className={cn("h-3 w-3", cfg.color)} aria-hidden />
      </div>

      {/* Compact single-line description */}
      <div className="min-w-0 flex-1 pt-1">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground/70">{actorName}</span>
          {" · "}
          <span>{cfg.label.toLowerCase()}</span>
          {statusDiff && (
            <>
              {": "}
              <span className="text-muted-foreground">{humaniseStatus(statusDiff.from)}</span>
              <ArrowRight className="mx-1 inline h-2.5 w-2.5 opacity-50" aria-hidden />
              <span className="font-medium text-foreground/80">{humaniseStatus(statusDiff.to)}</span>
            </>
          )}
          <time
            dateTime={new Date(entry.createdAt).toISOString()}
            className="ml-1.5 font-mono text-[10px] text-muted-foreground/50"
          >
            {rel}
          </time>
        </p>
      </div>
    </li>
  );
}

// ─── Composer ─────────────────────────────────────────────────────────────────

function Composer({
  issueId,
  onPost,
}: {
  issueId: string;
  onPost: (comment: FeedComment) => void;
}) {
  const [open, setOpen]       = useState(false);
  const [content, setContent] = useState("");
  const [error, setError]     = useState("");
  const [posting, setPosting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!content.trim()) { setError("Comment cannot be empty."); return; }

    setPosting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId, content }),
      });
      if (res.ok) {
        const newComment = await res.json();
        onPost(newComment);
        setContent("");
        setOpen(false);
      } else {
        setError("Failed to post comment. Please try again.");
      }
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setPosting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:border-border/80"
      >
        Add a note or comment…
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2" noValidate>
      <label htmlFor="feed-comment" className="sr-only">Add a comment</label>
      <Textarea
        id="feed-comment"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a note or comment…"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "feed-comment-error" : undefined}
        disabled={posting}
        rows={4}
        className="resize-none text-sm"
        autoFocus
      />
      {error && (
        <p id="feed-comment-error" role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => { setOpen(false); setContent(""); setError(""); }}
          disabled={posting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={posting || !content.trim()}
          className="gap-1.5"
        >
          {posting ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />Posting…</>
          ) : (
            <><Send className="h-3.5 w-3.5" aria-hidden />Comment</>
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ActivityFeed({
  issueId,
  comments,
  history,
}: {
  issueId: string;
  comments: FeedComment[];
  history: FeedHistoryEntry[];
}) {
  const [localComments, setLocalComments] = useState<FeedComment[]>(comments);

  // Merge comments + history into one sorted array
  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [
      ...localComments.map((c) => ({
        kind: "comment" as const,
        data: c,
        sortKey: c.createdAt ? new Date(c.createdAt).getTime() : 0,
      })),
      ...history.map((h) => ({
        kind: "event" as const,
        data: h,
        sortKey: new Date(h.createdAt).getTime(),
      })),
    ];
    return items.sort((a, b) => a.sortKey - b.sortKey);
  }, [localComments, history]);

  function handlePost(comment: FeedComment) {
    setLocalComments((prev) => [...prev, comment]);
  }

  const isEmpty = feed.length === 0;

  return (
    <div className="space-y-4">
      {/* Composer */}
      <Composer issueId={issueId} onPost={handlePost} />

      {/* Feed */}
      {isEmpty ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/10 px-3 py-3 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden="true" />
          No activity yet. Be the first to add a comment.
        </div>
      ) : (
        <ol aria-label="Issue activity and comments" className="space-y-0">
          {feed.map((item, idx) => {
            const isLast = idx === feed.length - 1;
            if (item.kind === "comment") {
              return (
                <CommentItem
                  key={`comment-${item.data.id ?? idx}`}
                  comment={item.data}
                  isLast={isLast}
                />
              );
            }
            return (
              <EventItem
                key={`event-${item.data.id}`}
                entry={item.data}
                isLast={isLast}
              />
            );
          })}
        </ol>
      )}
    </div>
  );
}
