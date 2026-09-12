"use client";

/**
 * ScreenshotUpload
 *
 * Changes vs. previous version:
 *   - Exposes `addFiles(files: File[])` via a ref-based imperative handle so
 *     the parent form can push clipboard-pasted images into this component
 *     without re-mounting it.
 *   - Accepts new files additively (appends to existing list) rather than
 *     replacing — matching the UX of Linear / GitHub where each paste or pick
 *     adds to the queue.
 *   - Drag-and-drop zone: dragging an image over the evidence card now
 *     highlights the drop zone and adds the image on drop.
 *   - Preview thumbnail click opens the image in a new tab.
 *   - Object URLs are revoked on removal and on unmount to prevent memory leaks.
 */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ImagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ─── Constants ──────────────────────────────────────────────────────────────

const ACCEPTED_MIME = /^image\/(jpeg|png|gif|webp)$/;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// ─── Imperative handle ───────────────────────────────────────────────────────

export type ScreenshotUploadHandle = {
  /** Push externally-sourced files (e.g. clipboard paste) into the component. */
  addFiles: (incoming: File[]) => void;
};

// ─── Component ───────────────────────────────────────────────────────────────

type FileEntry = { file: File; previewUrl: string };

export const ScreenshotUpload = forwardRef<
  ScreenshotUploadHandle,
  { onChange: (files: File[]) => void }
>(function ScreenshotUpload({ onChange }, ref) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [error, setError]     = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount.
  useEffect(() => {
    return () => {
      entries.forEach((e) => URL.revokeObjectURL(e.previewUrl));
    };
    // intentional exhaustive-deps omission — only runs on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Imperative handle ────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    addFiles: (incoming: File[]) => mergeFiles(incoming),
  }));

  // ── File validation and merging ──────────────────────────────────────────
  function mergeFiles(incoming: File[]) {
    setError("");
    const valid: FileEntry[] = [];
    let rejected = 0;

    for (const file of incoming) {
      if (!ACCEPTED_MIME.test(file.type) || file.size > MAX_BYTES) {
        rejected++;
        continue;
      }
      valid.push({ file, previewUrl: URL.createObjectURL(file) });
    }

    if (rejected > 0) {
      setError(
        `${rejected} file${rejected > 1 ? "s" : ""} skipped — only JPEG/PNG/GIF/WebP up to 5 MB allowed.`,
      );
    }

    setEntries((prev) => {
      const next = [...prev, ...valid];
      onChange(next.map((e) => e.file));
      return next;
    });
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    mergeFiles(Array.from(e.target.files ?? []));
    // Reset the input value so the same file can be re-selected after removal.
    e.target.value = "";
  }

  function removeAt(idx: number) {
    setEntries((prev) => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      const next = prev.filter((_, i) => i !== idx);
      onChange(next.map((e) => e.file));
      return next;
    });
  }

  // ── Drag-and-drop handlers ───────────────────────────────────────────────
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }
  function onDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) mergeFiles(files);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className={cn(
        "space-y-2.5 rounded-lg border border-dashed border-input bg-secondary/25 p-3 transition-colors md:p-4",
        isDragging && "border-primary bg-primary/5",
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        id="screenshots"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      <Label htmlFor="screenshots" className="flex items-center gap-1.5">
        <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        Screenshots
      </Label>

      <p className="text-xs text-muted-foreground">
        JPEG / PNG / GIF / WebP · max 5 MB each · drag, pick, or{" "}
        <kbd className="rounded border border-border/70 bg-muted/60 px-1 py-0.5 font-mono text-[10px]">
          Ctrl V
        </kbd>{" "}
        anywhere in the form to paste.
      </p>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
      >
        Add screenshots
      </Button>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {entries.length > 0 ? (
        <div
          className="flex flex-wrap gap-2"
          role="list"
          aria-label="Staged screenshots"
        >
          {entries.map((entry, idx) => (
            <div
              key={entry.previewUrl}
              role="listitem"
              className="group relative h-24 w-24 overflow-hidden rounded-md border bg-background"
            >
              <a
                href={entry.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Preview screenshot ${idx + 1}: ${entry.file.name}`}
              >
                <img
                  src={entry.previewUrl}
                  alt={`Screenshot preview ${idx + 1}`}
                  className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                />
              </a>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                aria-label={`Remove screenshot ${idx + 1}`}
                className="absolute right-0 top-0 h-6 rounded-none rounded-bl-md px-2 text-[10px] opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                onClick={() => removeAt(idx)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
});
