"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ScreenshotUpload({
  onChange,
}: {
  onChange: (files: File[]) => void;
}) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  function handleFiles(selected: FileList | null) {
    if (!selected) return;
    setError("");

    const valid: File[] = [];
    const previewUrls: string[] = [];
    let rejectedCount = 0;
    Array.from(selected).forEach((file) => {
      if (
        /image\/(jpeg|png|gif|webp)/.test(file.type) &&
        file.size <= 5 * 1024 * 1024
      ) {
        valid.push(file);
        previewUrls.push(URL.createObjectURL(file));
      } else {
        rejectedCount += 1;
      }
    });
    if (rejectedCount > 0) {
      setError(
        `${rejectedCount} file(s) were skipped. Only JPEG/PNG/GIF/WebP up to 5MB are allowed.`,
      );
    }

    setFiles(valid);
    setPreviews(previewUrls);
    onChange(valid);
  }

  function removeFile(idx: number) {
    const newFiles = files.slice();
    const newPreviews = previews.slice();
    newFiles.splice(idx, 1);
    newPreviews.splice(idx, 1);
    setFiles(newFiles);
    setPreviews(newPreviews);
    onChange(newFiles);
  }

  return (
    <div className="space-y-2.5 rounded-lg border border-dashed border-input bg-secondary/25 p-3 md:p-4">
      <input
        id="screenshots"
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Label htmlFor="screenshots">Screenshots</Label>
      <Button
        type="button"
        variant="outline"
        className="mb-1"
        onClick={() => inputRef.current?.click()}>
        Add Screenshots
      </Button>
      {error && (
        <div role="alert" className="mb-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <div
        className="flex flex-wrap gap-2"
        role="list"
        aria-label="Selected screenshots">
        {previews.map((src, idx) => (
          <div
            key={idx}
            role="listitem"
            className="relative h-24 w-24 overflow-hidden rounded-md border bg-background">
            <img
              src={src}
              alt={`Screenshot preview ${idx + 1}`}
              className="object-cover w-full h-full"
            />
            <Button
              type="button"
              size="sm"
              variant="destructive"
              aria-label={`Remove screenshot ${idx + 1}`}
              className="absolute right-0 top-0 h-6 rounded-none rounded-bl-md px-2 text-[10px]"
              onClick={() => removeFile(idx)}>
              ×
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
