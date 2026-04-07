"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/json",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export function AttachmentUpload({
  onChange,
}: {
  onChange: (files: File[]) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");

  function pickFiles(selected: FileList | null) {
    if (!selected) return;
    setError("");

    const accepted: File[] = [];
    let rejected = 0;
    for (const file of Array.from(selected)) {
      if (ACCEPTED_TYPES.includes(file.type) && file.size <= MAX_SIZE_BYTES) {
        accepted.push(file);
      } else {
        rejected += 1;
      }
    }

    if (rejected > 0) {
      setError(
        `${rejected} file(s) were skipped. Allowed: images, PDF, TXT, CSV, ZIP, JSON, DOC/DOCX, XLS/XLSX up to 10MB.`,
      );
    }

    setFiles(accepted);
    onChange(accepted);
  }

  function removeAt(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onChange(next);
  }

  return (
    <div className="space-y-2.5 rounded-lg border border-dashed border-input bg-secondary/25 p-3 md:p-4">
      <Label htmlFor="attachments">Associated files</Label>
      <input
        id="attachments"
        type="file"
        className="hidden"
        multiple
        onChange={(e) => pickFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => document.getElementById("attachments")?.click()}>
        Add attachments
      </Button>
      {error && (
        <div role="alert" className="text-sm text-destructive">
          {error}
        </div>
      )}
      {files.length > 0 && (
        <ul
          className="space-y-1 text-sm"
          aria-label="Selected associated files">
          {files.map((file, idx) => (
            <li
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between rounded-md border bg-background px-2.5 py-1.5">
              <span className="truncate pr-2">{file.name}</span>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="h-7 px-2"
                onClick={() => removeAt(idx)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
