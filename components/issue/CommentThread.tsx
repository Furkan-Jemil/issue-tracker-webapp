"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CommentThread({
  issueId,
  comments,
}: {
  issueId: string;
  comments: any[];
}) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);
  const [localComments, setLocalComments] = useState(comments);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!content.trim()) {
      setError("Comment cannot be empty.");
      return;
    }
    setPosting(true);
    try {
      const res = await fetch(`/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId, content }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setLocalComments([...localComments, newComment]);
        setContent("");
      } else {
        setError("Failed to post comment.");
      }
    } finally {
      setPosting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="border-b border-border/60 bg-muted/20">
        <CardTitle className="text-lg">Comments</CardTitle>
        <p className="text-sm text-muted-foreground">
          Discussion and updates for this issue. {localComments.length} comment{localComments.length === 1 ? "" : "s"}.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul
          className="space-y-2"
          aria-live="polite"
          aria-relevant="additions text">
          {localComments.map((c, idx) => (
            <li
              key={c.id || idx}
              className="rounded-lg border border-border/70 bg-background/80 px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="font-medium">{c.user?.name || "Unknown"}</span>
                <span>{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <p className="pt-1.5 text-sm leading-6 text-foreground/95">{c.content}</p>
            </li>
          ))}
          {localComments.length === 0 && (
            <li className="rounded-lg border border-dashed border-border/70 bg-background/60 px-3 py-3 text-sm text-muted-foreground">
              No comments yet. Start the conversation below.
            </li>
          )}
        </ul>

        <form onSubmit={handleSubmit} className="space-y-2 border-t border-border/60 pt-3">
          <Label htmlFor="comment-content">Add a comment</Label>
          <Textarea
            id="comment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment..."
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "comment-error" : undefined}
            disabled={posting}
            required
          />
          {error && (
            <div
              id="comment-error"
              role="alert"
              className="text-sm text-destructive">
              {error}
            </div>
          )}
          <Button type="submit" disabled={posting}>
            {posting ? "Posting..." : "Post comment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
