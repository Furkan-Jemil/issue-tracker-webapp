"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScreenshotUpload } from "@/app/(main)/tasks/screenshot-upload";
import { AttachmentUpload } from "@/app/(main)/tasks/attachment-upload";

type AssigneeOption = { id: string; label: string };

export function NewIssueForm({
  action,
  errorMessage,
  isAdmin,
  loggedByLabel,
  assignees,
}: {
  action: (formData: FormData) => void | Promise<void>;
  errorMessage: string;
  isAdmin: boolean;
  loggedByLabel: string;
  assignees: AssigneeOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const screenshotsMetaRef = useRef<HTMLInputElement>(null);
  const attachmentsMetaRef = useRef<HTMLInputElement>(null);
  const nativeSubmitPendingRef = useRef(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (nativeSubmitPendingRef.current) {
      nativeSubmitPendingRef.current = false;
      return;
    }

    e.preventDefault();
    setUploadError("");

    const form = e.currentTarget;
    if (!form.reportValidity()) return;

    let screenshotsMeta: Array<{ url: string; filename: string; mimeType: string; sizeBytes: number }> = [];
    let attachmentsMeta: Array<{ url: string; filename: string; mimeType: string; sizeBytes: number }> = [];

    if (screenshotFiles.length > 0 || attachmentFiles.length > 0) {
      const uploadFd = new FormData();
      screenshotFiles.forEach((file) => uploadFd.append("screenshots", file));
      attachmentFiles.forEach((file) => uploadFd.append("attachments", file));

      try {
        const response = await fetch("/api/upload", { method: "POST", body: uploadFd });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          setUploadError(typeof payload?.error === "string" ? payload.error : "File upload failed. Please retry before saving.");
          return;
        }
        screenshotsMeta = Array.isArray(payload.files) ? payload.files : [];
        attachmentsMeta = Array.isArray(payload.attachments) ? payload.attachments : [];
      } catch {
        setUploadError("File upload is temporarily unavailable. Please retry before saving.");
        return;
      }
    }

    if (screenshotsMetaRef.current) screenshotsMetaRef.current.value = JSON.stringify(screenshotsMeta);
    if (attachmentsMetaRef.current) attachmentsMetaRef.current.value = JSON.stringify(attachmentsMeta);

    nativeSubmitPendingRef.current = true;
    startTransition(() => {
      formRef.current?.requestSubmit();
    });
  }

  return (
    <div className="page-stack">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-muted/35 via-muted/10 to-transparent pb-3">
          <CardTitle className="text-xl">Report issue</CardTitle>
          <CardDescription>Capture what happened, where it happened, and who should own the fix.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-5">
          <form ref={formRef} className="space-y-4" action={action} onSubmit={onSubmit}>
            <input ref={screenshotsMetaRef} type="hidden" name="screenshotsMeta" defaultValue="[]" />
            <input ref={attachmentsMetaRef} type="hidden" name="attachmentsMeta" defaultValue="[]" />

            {errorMessage ? <div role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div> : null}
            {uploadError ? <div role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{uploadError}</div> : null}

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Issue title</Label>
                  <Input id="title" name="title" placeholder="Example: Login fails after password reset" required maxLength={255} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description">What happened?</Label>
                  <Textarea id="description" name="description" placeholder="Describe the issue, expected behavior, and what you observed." required rows={8} />
                  <p className="text-xs text-muted-foreground">Keep this short and concrete. Include steps if possible.</p>
                </div>

                <Card tone="soft" density="dense" className="border-border/70">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Evidence</CardTitle>
                    <CardDescription>Add screenshots or files to help triage quickly.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ScreenshotUpload onChange={setScreenshotFiles} />
                    <AttachmentUpload onChange={setAttachmentFiles} />
                  </CardContent>
                </Card>
              </div>

              <aside className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-3 md:p-4">
                <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Quick setup</h3>
                  <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="priority">Priority</Label>
                      <Select id="priority" name="priority" required defaultValue="MEDIUM">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="assigneeId">Assign to</Label>
                      <Select id="assigneeId" name="assigneeId" defaultValue="">
                        <option value="">Unassigned</option>
                        {assignees.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>

                <details className="group rounded-lg border border-border/70 bg-background/70 p-3">
                  <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">More details (optional)</summary>
                  <div className="mt-3 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                      <div className="space-y-1.5">
                        <Label htmlFor="status">Status</Label>
                        <Select id="status" name="status" defaultValue="OPEN" disabled={!isAdmin}>
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </Select>
                        <p className="text-xs text-muted-foreground">Only admins can set status while creating.</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="type">Type</Label>
                        <Select id="type" name="type" required defaultValue="BUG">
                          <option value="BUG">Bug</option>
                          <option value="IMPROVEMENT">Improvement</option>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                      <div className="space-y-1.5">
                        <Label htmlFor="severity">Severity</Label>
                        <Select id="severity" name="severity" required defaultValue="MINOR">
                          <option value="MINOR">Minor</option>
                          <option value="MAJOR">Major</option>
                          <option value="CRITICAL">Critical</option>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="reportedAt">Date reported</Label>
                        <Input id="reportedAt" name="reportedAt" type="date" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="url">Page or feature URL</Label>
                      <Input id="url" name="url" type="url" placeholder="https://example.com/path" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sourceNotes">Context note</Label>
                      <Input id="sourceNotes" name="sourceNotes" placeholder="Example: Reported by support call / customer email" />
                    </div>
                  </div>
                </details>

                <div className="space-y-1.5 border-t border-border/60 pt-4">
                  <Label htmlFor="loggedByDisplay">Reported by</Label>
                  <Input id="loggedByDisplay" value={loggedByLabel} readOnly />
                  <p className="text-xs text-muted-foreground">This is filled automatically from your account.</p>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">Tip: start with title and description, then add details only when needed.</div>
              </aside>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
              <Button type="submit" disabled={pending} className="w-full md:w-auto">
                {pending ? "Saving..." : "Create issue"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}