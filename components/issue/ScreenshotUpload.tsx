"use client";
import React, { useRef, useState } from "react";

export function ScreenshotUpload({
  onChange,
}: {
  onChange: (files: File[], previews: string[]) => void;
}) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(selected: FileList | null) {
    if (!selected) return;
    const valid: File[] = [];
    const previewUrls: string[] = [];
    Array.from(selected).forEach((file) => {
      if (
        /image\/(jpeg|png|gif|webp)/.test(file.type) &&
        file.size <= 5 * 1024 * 1024
      ) {
        valid.push(file);
        previewUrls.push(URL.createObjectURL(file));
      }
    });
    setFiles(valid);
    setPreviews(previewUrls);
    onChange(valid, previewUrls);
  }

  function removeFile(idx: number) {
    const newFiles = files.slice();
    const newPreviews = previews.slice();
    newFiles.splice(idx, 1);
    newPreviews.splice(idx, 1);
    setFiles(newFiles);
    setPreviews(newPreviews);
    onChange(newFiles, newPreviews);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        className="mb-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        onClick={() => inputRef.current?.click()}>
        Add Screenshots
      </button>
      <div className="flex flex-wrap gap-2">
        {previews.map((src, idx) => (
          <div
            key={idx}
            className="relative w-24 h-24 border rounded overflow-hidden">
            <img
              src={src}
              alt="preview"
              className="object-cover w-full h-full"
            />
            <button
              type="button"
              className="absolute top-0 right-0 bg-red-500 text-white rounded-bl px-1 text-xs"
              onClick={() => removeFile(idx)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
