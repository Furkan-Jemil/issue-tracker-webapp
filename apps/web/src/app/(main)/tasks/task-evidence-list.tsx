"use client";

import React, { useMemo, useState } from "react";
import { ExternalLink, Paperclip } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screenshot = {
  id: string;
  filename: string;
  url: string;
  sizeBytes?: number;
};

type Attachment = {
  id: string;
  filename: string;
  url: string;
  sizeBytes?: number;
  mimeType?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Screenshot tile ─────────────────────────────────────────────────────────

function ScreenshotTile({ screenshot }: { screenshot: Screenshot }) {
  const [hasError, setHasError] = useState(false);
  const altText = useMemo(
    () => `Screenshot: ${screenshot.filename}`,
    [screenshot.filename],
  );

  return (
    <a
      href={screenshot.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border/60 bg-muted/20 transition-all hover:border-border hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Open screenshot: ${screenshot.filename}`}
    >
      {/* Thumbnail */}
      <div className="relative h-24 w-full overflow-hidden bg-muted/30">
        {hasError ? (
          <div className="flex h-full w-full items-center justify-center">
            <Paperclip
              className="h-6 w-6 text-muted-foreground/40"
              aria-hidden="true"
            />
          </div>
        ) : (
          <img
            src={screenshot.url}
            alt={altText}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            onError={() => setHasError(true)}
          />
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/10">
          <ExternalLink
            className="h-4 w-4 text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Metadata footer */}
      <div className="border-t border-border/50 px-2 py-1.5">
        <p className="truncate text-[11px] font-medium text-foreground/80">
          {screenshot.filename}
        </p>
        {screenshot.sizeBytes != null && (
          <p className="font-mono text-[10px] text-muted-foreground">
            {formatBytes(screenshot.sizeBytes)}
          </p>
        )}
      </div>
    </a>
  );
}

// ─── Attachment row ──────────────────────────────────────────────────────────

function AttachmentRow({ file }: { file: Attachment }) {
  const ext = file.filename.split(".").pop()?.toUpperCase() ?? "FILE";

  return (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 transition-all hover:border-border hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Download attachment: ${file.filename}`}
    >
      {/* File type chip */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
        {ext.slice(0, 4)}
      </div>

      {/* Name + size */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">
          {file.filename}
        </p>
        {file.sizeBytes != null && (
          <p className="font-mono text-[10px] text-muted-foreground">
            {formatBytes(file.sizeBytes)}
          </p>
        )}
      </div>

      {/* Open icon */}
      <ExternalLink
        className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-foreground/70"
        aria-hidden="true"
      />
    </a>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export function IssueEvidenceList({
  screenshots,
  attachments,
}: {
  screenshots: Screenshot[];
  attachments: Attachment[];
}) {
  const hasScreenshots = screenshots.length > 0;
  const hasAttachments = attachments.length > 0;
  const hasEvidence = hasScreenshots || hasAttachments;

  if (!hasEvidence) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/10 px-3 py-3 text-xs text-muted-foreground">
        <Paperclip className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden="true" />
        No evidence attached to this issue.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Screenshots grid */}
      {hasScreenshots && (
        <div>
          <p className="mb-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Screenshots ({screenshots.length})
          </p>
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
            role="list"
            aria-label="Screenshots"
          >
            {screenshots.map((s) => (
              <div key={s.id} role="listitem">
                <ScreenshotTile screenshot={s} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachments list */}
      {hasAttachments && (
        <div>
          <p className="mb-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Files ({attachments.length})
          </p>
          <div className="space-y-2" role="list" aria-label="Attached files">
            {attachments.map((f) => (
              <div key={f.id} role="listitem">
                <AttachmentRow file={f} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
