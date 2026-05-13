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
        <div className="flex items-center justify-between">
          <CardTitle id="comments-heading" className="text-lg">Comments</CardTitle>
          <span className="text-xs font-medium text-muted-foreground">{localComments.length}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {localComments.length > 0 && (
          <ul
            className="space-y-3 border-b border-border/60 pb-4"
            aria-live="polite"
            aria-relevant="additions text">
            {localComments.map((c, idx) => (
              <li key={c.id || idx} className="text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-foreground">{c.user?.name || "Unknown"}</span>
                  <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 leading-6 text-foreground/90">{c.content}</p>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            id="comment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment..."
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "comment-error" : undefined}
            disabled={posting}
            required
            className="min-h-[80px]"
          />
          {error && (
            <div
              id="comment-error"
              role="alert"
              className="text-xs text-destructive">
              {error}
            </div>
          )}
          <Button type="submit" disabled={posting} size="sm">
            {posting ? "Posting..." : "Comment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
