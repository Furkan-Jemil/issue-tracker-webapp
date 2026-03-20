"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

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
    <div>
      <h2 className="font-semibold mb-2">Comments</h2>
      <ul className="mb-4">
        {localComments.map((c, idx) => (
          <li key={c.id || idx} className="mb-2 p-2 border rounded">
            <div className="text-sm text-gray-700">
              {c.user?.name || "Unknown"}{" "}
              <span className="text-xs text-gray-400">
                [{new Date(c.createdAt).toLocaleString()}]
              </span>
            </div>
            <div>{c.content}</div>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          className="border p-2 rounded"
          required
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <Button type="submit">Post Comment</Button>
      </form>
    </div>
  );
}
