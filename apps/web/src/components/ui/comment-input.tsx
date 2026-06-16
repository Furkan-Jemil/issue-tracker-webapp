import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error?: string;
  posting?: boolean;
  placeholder?: string;
}

export function CommentInput({
  value,
  onChange,
  onSubmit,
  error,
  posting,
  placeholder = "Share your feedback, questions, or updates...",
}: CommentInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="comment-content" className="block text-sm font-semibold text-foreground flex items-center gap-2">
        <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add your thoughts
      </label>
      <form onSubmit={onSubmit} className="space-y-2">
        <Textarea
          id="comment-content"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "comment-error" : undefined}
          disabled={posting}
          required
          className="min-h-[88px] border-border/50 bg-slate-50/50 text-sm resize-none rounded-md"
        />
        {error && (
          <div id="comment-error" role="alert" className="text-xs text-destructive flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        <Button type="submit" disabled={posting} size="sm" className="w-full sm:w-auto">
          {posting ? "Posting..." : "Post comment"}
        </Button>
      </form>
    </div>
  );
}
