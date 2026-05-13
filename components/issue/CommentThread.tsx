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
    <Card className="border-0 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-gradient-to-r from-slate-50/50 to-blue-50/50 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z"/></svg>
            <CardTitle id="comments-heading" className="text-base font-semibold">Discussion</CardTitle>
          </div>
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">{localComments.length}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {localComments.length > 0 && (
          <ul
            className="space-y-3 border-b border-border/60 pb-4"
            aria-live="polite"
            aria-relevant="additions text">
            {localComments.map((c, idx) => (
              <li key={c.id || idx} className="group rounded-lg border border-border/50 bg-gradient-to-r from-slate-50/30 to-transparent p-3 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                      {(c.user?.name || "U")[0].toUpperCase()}
                    </div>
                    <span className="font-semibold text-foreground">{c.user?.name || "Anonymous"}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="leading-6 text-foreground/85 text-sm pl-8">{c.content}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2">
          <label htmlFor="comment-content" className="block text-sm font-semibold text-foreground flex items-center gap-2">
            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add your thoughts
          </label>
          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              id="comment-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your feedback, questions, or updates..."
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "comment-error" : undefined}
              disabled={posting}
              required
              className="min-h-[88px] border-border/50 bg-slate-50/50 text-sm resize-none rounded-md"
            />
            {error && (
              <div
                id="comment-error"
                role="alert"
                className="text-xs text-destructive flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                {error}
              </div>
            )}
            <Button type="submit" disabled={posting} size="sm" className="w-full sm:w-auto">
              {posting ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12a9 9 0 0918 0 9 9 0 01-18 0z" /></svg>
                  Posting...
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  Post comment
                </>
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
