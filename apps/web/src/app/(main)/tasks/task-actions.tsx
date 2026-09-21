"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ScreenshotUpload,
  type ScreenshotUploadHandle,
} from "@/app/(main)/tasks/screenshot-upload";
import { AttachmentUpload } from "@/app/(main)/tasks/attachment-upload";
import { cn } from "@/lib/utils";
import { deleteIssue, updateIssue } from "@/app/(main)/tasks/[task-id]/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type IssueInitial = {
  title: string;
  description: string;
  type: string;
  priority: string;
  severity: string;
  url: string | null;
  sourceNotes: string | null;
  reportedAt: string;
  assigneeId: string | null;
  status: string;
};

type AssigneeOption = {
  id: string;
  label: string;
};

type UploadedFile = {
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function IssueActions({
  issueId,
  initial,
  canEdit,
  canDelete,
  isAdmin,
  assigneeOptions,
}: {
  issueId: string;
  initial: IssueInitial;
  canEdit: boolean;
  canDelete: boolean;
  isAdmin: boolean;
  assigneeOptions: AssigneeOption[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // ── Evidence upload state ────────────────────────────────────────────────
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [pasteNotice, setPasteNotice] = useState(false);

  const screenshotsMetaRef  = useRef<HTMLInputElement>(null);
  const attachmentsMetaRef  = useRef<HTMLInputElement>(null);
  const screenshotUploadRef = useRef<ScreenshotUploadHandle>(null);
  const pasteTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Prevents the custom onSubmit handler from intercepting the second
  // (native) submit triggered by requestSubmit() after uploads complete.
  const nativeSubmitRef     = useRef(false);

  // Open the editor panel when the page is deep-linked to #edit-section
  // (e.g. from the StatusQuickActions "Edit" button).
  useEffect(() => {
    if (!canEdit) return;

    function openWhenHashMatches() {
      if (window.location.hash === "#edit-section") {
        setOpen(true);
      }
    }

    openWhenHashMatches();
    window.addEventListener("hashchange", openWhenHashMatches);
    return () => window.removeEventListener("hashchange", openWhenHashMatches);
  }, [canEdit]);

  // ── Clipboard paste handler ──────────────────────────────────────────────
  function handleFormPaste(e: React.ClipboardEvent<HTMLFormElement>) {
    const imageItems = Array.from(e.clipboardData?.items ?? []).filter((i) =>
      i.type.startsWith("image/"),
    );
    if (imageItems.length === 0) return;
    e.preventDefault();

    const files: File[] = [];
    for (const item of imageItems) {
      const blob = item.getAsFile();
      if (!blob) continue;
      const ext = item.type.split("/")[1] ?? "png";
      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      files.push(new File([blob], `paste-${ts}.${ext}`, { type: item.type }));
    }
    if (!files.length) return;

    screenshotUploadRef.current?.addFiles(files);
    setPasteNotice(true);
    if (pasteTimerRef.current) clearTimeout(pasteTimerRef.current);
    pasteTimerRef.current = setTimeout(() => setPasteNotice(false), 2000);
  }

  // ── Submit handler ───────────────────────────────────────────────────────
  // First pass: intercept, upload files, populate hidden inputs, then call
  // requestSubmit() to let the Server Action receive the full FormData.
  // Second pass: nativeSubmitRef is set — return early so the action fires.
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (nativeSubmitRef.current) {
      nativeSubmitRef.current = false;
      return;
    }

    e.preventDefault();
    setUploadError("");

    const form = e.currentTarget;
    if (!form.reportValidity()) return;

    let screenshotsMeta: UploadedFile[] = [];
    let attachmentsMeta: UploadedFile[] = [];

    if (screenshotFiles.length > 0 || attachmentFiles.length > 0) {
      const fd = new FormData();
      screenshotFiles.forEach((f) => fd.append("screenshots", f));
      attachmentFiles.forEach((f) => fd.append("attachments", f));

      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          setUploadError(
            typeof payload?.error === "string"
              ? payload.error
              : "File upload failed. Please retry before saving.",
          );
          return;
        }
        screenshotsMeta = Array.isArray(payload.files) ? payload.files : [];
        attachmentsMeta = Array.isArray(payload.attachments) ? payload.attachments : [];
      } catch {
        setUploadError(
          "File upload is temporarily unavailable. Please retry before saving.",
        );
        return;
      }
    }

    if (screenshotsMetaRef.current)
      screenshotsMetaRef.current.value = JSON.stringify(screenshotsMeta);
    if (attachmentsMetaRef.current)
      attachmentsMetaRef.current.value = JSON.stringify(attachmentsMeta);

    nativeSubmitRef.current = true;
    startTransition(() => {
      form.requestSubmit();
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <section id="edit-section" className="space-y-4" aria-label="Issue actions">
      <div className="rounded-xl border border-border/70 bg-card/80 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Issue actions
          </p>
          {canEdit ? (
            <Button
              type="button"
              variant={open ? "secondary" : "outline"}
              onClick={() => setOpen((v) => !v)}>
              {open ? "Close editor" : "Update issue"}
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              className="sm:ml-auto"
              onClick={() => {
                if (
                  !confirm(
                    "Delete this issue and all related data? This cannot be undone.",
                  )
                ) {
                  return;
                }
                startTransition(() => {
                  deleteIssue(issueId);
                });
              }}>
              Delete issue
            </Button>
          ) : null}
        </div>
      </div>

      {canEdit && open ? (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/60 bg-muted/20">
            <CardTitle className="text-lg">Update issue</CardTitle>
            <p className="text-sm text-muted-foreground">
              Refine issue details, update workflow fields, then save changes.
            </p>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              action={(fd) => {
                startTransition(() => {
                  updateIssue(issueId, fd);
                });
              }}
              onSubmit={onSubmit}
              onPaste={handleFormPaste}
            >
              {/* Hidden inputs that carry new-evidence metadata to the Server Action */}
              <input
                ref={screenshotsMetaRef}
                type="hidden"
                name="newScreenshotsMeta"
                defaultValue="[]"
              />
              <input
                ref={attachmentsMetaRef}
                type="hidden"
                name="newAttachmentsMeta"
                defaultValue="[]"
              />

              {/* Upload error banner */}
              {uploadError ? (
                <div
                  role="alert"
                  className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
                >
                  {uploadError}
                </div>
              ) : null}

              {/* Clipboard-paste confirmation */}
              <div
                role="status"
                aria-live="polite"
                className={cn(
                  "flex items-center gap-2 overflow-hidden rounded-md border border-emerald-300/60 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-700 transition-all duration-200 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300",
                  pasteNotice ? "max-h-12 opacity-100" : "max-h-0 border-0 p-0 opacity-0",
                )}
              >
                <ImagePlus className="h-4 w-4 shrink-0" aria-hidden="true" />
                Screenshot pasted and staged for upload.
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                {/* Left: narrative fields + evidence upload */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      name="title"
                      required
                      maxLength={255}
                      defaultValue={initial.title}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      name="description"
                      required
                      rows={9}
                      defaultValue={initial.description}
                    />
                  </div>

                  {/* Evidence append section */}
                  <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Append evidence
                      <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground/70">
                        — paste{" "}
                        <kbd className="rounded border border-border/70 bg-muted/60 px-1 font-mono text-[10px]">
                          Ctrl V
                        </kbd>{" "}
                        anywhere to add a screenshot
                      </span>
                    </p>
                    <ScreenshotUpload
                      ref={screenshotUploadRef}
                      onChange={setScreenshotFiles}
                    />
                    <AttachmentUpload onChange={setAttachmentFiles} />
                  </div>
                </div>

                {/* Right: workflow sidebar */}
                <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-3 md:p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Workflow and metadata
                  </p>
                  <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-type">Type</Label>
                      <Select
                        id="edit-type"
                        name="type"
                        required
                        defaultValue={initial.type}>
                        <option value="BUG">Bug</option>
                        <option value="IMPROVEMENT">Improvement</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-priority">Priority</Label>
                      <Select
                        id="edit-priority"
                        name="priority"
                        required
                        defaultValue={initial.priority}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-severity">Severity</Label>
                      <Select
                        id="edit-severity"
                        name="severity"
                        required
                        defaultValue={initial.severity}>
                        <option value="MINOR">Minor</option>
                        <option value="MAJOR">Major</option>
                        <option value="CRITICAL">Critical</option>
                      </Select>
                    </div>
                  </div>
                  {isAdmin ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-status">Status</Label>
                      <Select
                        id="edit-status"
                        name="status"
                        required
                        defaultValue={initial.status}>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </Select>
                    </div>
                  ) : null}
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-url">URL (optional)</Label>
                    <Input
                      id="edit-url"
                      name="url"
                      type="url"
                      placeholder="https://..."
                      defaultValue={initial.url ?? ""}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-sourceNotes">
                      Source notes (optional)
                    </Label>
                    <Input
                      id="edit-sourceNotes"
                      name="sourceNotes"
                      placeholder="Add extra context for reviewers"
                      defaultValue={initial.sourceNotes ?? ""}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-reportedAt">Date reported</Label>
                      <Input
                        id="edit-reportedAt"
                        name="reportedAt"
                        type="date"
                        defaultValue={initial.reportedAt}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-assigneeId">Assigned to</Label>
                      <Select
                        id="edit-assigneeId"
                        name="assigneeId"
                        defaultValue={initial.assigneeId ?? ""}
                        disabled={!isAdmin}>
                        <option value="">Unassigned</option>
                        {assigneeOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <p className="text-xs text-muted-foreground sm:ml-auto">
                  Saved updates appear immediately on this page.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
