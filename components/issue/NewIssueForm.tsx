"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScreenshotUpload } from "@/components/issue/ScreenshotUpload";

type MetaEntry = {
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
};

export function NewIssueForm({
  action,
  errorMessage,
}: {
  action: (formData: FormData) => void | Promise<void>;
  errorMessage: string;
}) {
  const [pending, startTransition] = useTransition();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    let meta: MetaEntry[] = [];
    if (files.length > 0) {
      const uploadFd = new FormData();
      for (const f of files) {
        uploadFd.append("screenshots", f);
      }
      const res = await fetch("/api/upload", { method: "POST", body: uploadFd });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError(
          typeof payload?.error === "string"
            ? payload.error
            : "Screenshot upload failed.",
        );
        return;
      }
      meta = Array.isArray(payload.files) ? payload.files : [];
    }
    formData.set("screenshotsMeta", JSON.stringify(meta));
    startTransition(() => {
      action(formData);
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-4 md:px-6 md:py-8">
      <Card>
        <CardHeader>
          <CardTitle>New issue</CardTitle>
          <CardDescription>
            Describe the problem or improvement. Uploads are optional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            {errorMessage ? (
              <div
                role="alert"
                className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}
            {uploadError ? (
              <div
                role="alert"
                className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {uploadError}
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required maxLength={255} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" required rows={6} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <Select id="type" name="type" required defaultValue="BUG">
                  <option value="BUG">Bug</option>
                  <option value="IMPROVEMENT">Improvement</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="priority">Priority</Label>
                <Select id="priority" name="priority" required defaultValue="MEDIUM">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="severity">Severity</Label>
                <Select id="severity" name="severity" required defaultValue="MINOR">
                  <option value="MINOR">Minor</option>
                  <option value="MAJOR">Major</option>
                  <option value="CRITICAL">Critical</option>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="url">URL (optional)</Label>
              <Input id="url" name="url" type="url" placeholder="https://..." />
            </div>
            <ScreenshotUpload
              onChange={(next) => {
                setFiles(next);
              }}
            />
            <Button type="submit" disabled={pending} className="w-full md:w-auto">
              {pending ? "Submitting…" : "Create issue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
