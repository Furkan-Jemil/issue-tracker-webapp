"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const [localComments, setLocalComments] = useState(comments);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!content.trim()) {
      setError("Comment cannot be empty.");
      return;
    }
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
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Comments</h2>
      <ul
        className="space-y-2"
        aria-live="polite"
        aria-relevant="additions text">
        {localComments.map((c, idx) => (
          <li key={c.id || idx}>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">
                  {c.user?.name || "Unknown"}{" "}
                  <span className="text-xs">
                    [{new Date(c.createdAt).toLocaleString()}]
                  </span>
                </div>
                <div className="pt-1 text-sm">{c.content}</div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} className="space-y-2">
        <Label htmlFor="comment-content">Add a comment</Label>
        <Textarea
          id="comment-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "comment-error" : undefined}
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
        <Button type="submit">Post Comment</Button>
      </form>
    </div>
  );
}
