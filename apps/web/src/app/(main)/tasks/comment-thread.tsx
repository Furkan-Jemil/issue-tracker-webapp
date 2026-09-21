"use client";

import React, { useState } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ────────────────────────────────────────────────────────────────────

type Comment = {
  id?: string;
  content: string;
  createdAt?: string | Date;
  user?: { name: string | null } | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCommentDate(d: string | Date | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Comment bubble ──────────────────────────────────────────────────────────

function CommentBubble({ comment, index }: { comment: Comment; index: number }) {
  const name = comment.user?.name || "Anonymous";
  const avatar = initials(comment.user?.name);

  return (
    <li className="flex gap-3">
      {/* Avatar */}
      <div
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted text-[10px] font-semibold uppercase text-muted-foreground"
      >
        {avatar}
      </div>

      {/* Bubble */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-xs font-semibold text-foreground">{name}</span>
          {comment.createdAt && (
            <time
              dateTime={new Date(comment.createdAt).toISOString()}
              className="font-mono text-[10px] text-muted-foreground"
            >
              {formatCommentDate(comment.createdAt)}
            </time>
          )}
        </div>
        <p className="mt-1 rounded-lg rounded-tl-none border border-border/50 bg-muted/20 px-3 py-2 text-sm leading-relaxed text-foreground/85">
          {comment.content}
        </p>
      </div>
    </li>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function CommentThread({
  issueId,
  comments,
}: {
  issueId: string;
  comments: Comment[];
}) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(comments);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("Comment cannot be empty.");
      return;
    }

    setPosting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId, content }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setLocalComments((prev) => [...prev, newComment]);
        setContent("");
      } else {
        setError("Failed to post comment. Please try again.");
      }
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <CardHeader className="flex-row items-center justify-between border-b border-border/60 bg-muted/30 px-5 py-3">
        <CardTitle
          id="comments-heading"
          className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
        >
          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
          Discussion
        </CardTitle>
        {localComments.length > 0 && (
          <span className="font-mono text-xs font-semibold text-muted-foreground">
            {localComments.length}{" "}
            {localComments.length === 1 ? "comment" : "comments"}
          </span>
        )}
      </CardHeader>

      <CardContent className="px-5 py-5 space-y-5">
        {/* Comment list */}
        {localComments.length > 0 ? (
          <ul
            aria-live="polite"
            aria-relevant="additions text"
            aria-label="Comments"
            className="space-y-4"
          >
            {localComments.map((c, idx) => (
              <CommentBubble key={c.id ?? idx} comment={c} index={idx} />
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/10 px-3 py-3 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden="true" />
            No comments yet. Be the first to add context.
          </div>
        )}

        {/* Composer */}
        <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
          <div className="flex gap-3">
            {/* Composer avatar placeholder */}
            <div
              aria-hidden="true"
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted text-[10px] font-semibold uppercase text-muted-foreground"
            >
              Me
            </div>

            <div className="flex-1 space-y-2">
              <label htmlFor="comment-content" className="sr-only">
                Add a comment
              </label>
              <Textarea
                id="comment-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add a comment, question, or update…"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "comment-error" : undefined}
                disabled={posting}
                rows={3}
                className="resize-none text-sm"
              />

              {error && (
                <p
                  id="comment-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {error}
                </p>
              )}

              {/* Submit row */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={posting || !content.trim()}
                  className="gap-1.5"
                >
                  {posting ? (
                    <>
                      <Loader2
                        className="h-3.5 w-3.5 animate-spin"
                        aria-hidden="true"
                      />
                      Posting…
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" aria-hidden="true" />
                      Post Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
