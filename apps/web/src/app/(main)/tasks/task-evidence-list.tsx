"use client";

import React, { useMemo, useState } from "react";

type Screenshot = {
  id: string;
  filename: string;
  url: string;
};

type Attachment = {
  id: string;
  filename: string;
  url: string;
};

function FileFallback({ filename }: { filename: string }) {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-md border border-border/60 bg-slate-50 px-2 text-center text-[10px] font-medium text-slate-600">
      <span className="line-clamp-3 break-words">{filename}</span>
    </div>
  );
}

function ScreenshotTile({ screenshot }: { screenshot: Screenshot }) {
  const [hasError, setHasError] = useState(false);

  const altText = useMemo(() => `Screenshot: ${screenshot.filename}`, [screenshot.filename]);

  return (
    <a
      href={screenshot.url}
      target="_blank"
      rel="noopener noreferrer"
      role="listitem"
      className="group relative overflow-hidden rounded-md border border-border/50 bg-gradient-to-br from-slate-100 to-slate-50 transition-all hover:border-border hover:shadow-sm"
    >
      {hasError ? (
        <FileFallback filename={screenshot.filename} />
      ) : (
        <img
          src={screenshot.url}
          alt={altText}
          className="h-20 w-20 object-cover transition-transform duration-200 group-hover:scale-110"
          onError={() => setHasError(true)}
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
        <svg
          className="h-4 w-4 text-white opacity-0 transition-opacity group-hover:opacity-100"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-4-4l-8 8"
          />
        </svg>
      </div>
    </a>
  );
}

export function IssueEvidenceList({
  screenshots,
  attachments,
}: {
  screenshots: Screenshot[];
  attachments: Attachment[];
}) {
  const hasEvidence = screenshots.length > 0 || attachments.length > 0;

  return (
    <div className="pt-2 border-t border-border/50">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
        Evidence attached
      </p>

      {hasEvidence ? (
        <div className="flex flex-wrap gap-2" role="list">
          {screenshots.map((screenshot) => (
            <ScreenshotTile key={screenshot.id} screenshot={screenshot} />
          ))}
          {attachments.map((file) => (
            <a
              key={file.id}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border/50 bg-gradient-to-br from-slate-100 to-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-200 hover:text-slate-900 group"
            >
              <svg
                className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-800"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0113 2.586V4h2.828a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 011 1v6H6v-6z" />
              </svg>
              <span className="truncate max-w-[120px]">{file.filename}</span>
            </a>
          ))}
        </div>
      ) : (
        /* Minimal empty state — makes it clear the section rendered correctly
           and no evidence was attached, rather than silently returning null. */
        <div className="flex items-center gap-2 rounded-md border border-dashed border-border/50 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
          <svg
            className="h-3.5 w-3.5 shrink-0 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
          No evidence attached
        </div>
      )}
    </div>
  );
}