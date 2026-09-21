"use client";

/**
 * SidebarActions
 *
 * Replaces the old isolated "Issue actions" bar at the bottom of the detail
 * page. Lives inside the right-rail sidebar so both columns fill evenly.
 *
 * Renders:
 *   - An "Update issue" toggle that expands the full edit form inline.
 *   - A "Delete issue" button (admin-only, destructive).
 *
 * The full edit form is identical to the one in task-actions.tsx — the only
 * difference is placement (sidebar vs. full-width bottom section).
 */

import { useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus, Pencil, Trash2 } from "lucide-react";

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

type AssigneeOption = { id: string; label: string };
type UploadedFile = { url: string; filename: string; mimeType: string; sizeBytes: number };

// ─── Component ────────────────────────────────────────────────────────────────

export function SidebarActions({
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
  const [open, setOpen]            = useState(false);
  const [pending, startTransition] = useTransition();

  // Evidence upload state
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [uploadError, setUploadError]         = useState("");
  const [pasteNotice, setPasteNotice]         = useState(false);

  const screenshotsMetaRef  = useRef<HTMLInputElement>(null);
  const attachmentsMetaRef  = useRef<HTMLInputElement>(null);
  const screenshotUploadRef = useRef<ScreenshotUploadHandle>(null);
  const pasteTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nativeSubmitRef     = useRef(false);

  // Open from #edit-section deep-link
  useEffect(() => {
    if (!canEdit) return;
    function check() {
      if (window.location.hash === "#edit-section") setOpen(true);
    }
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [canEdit]);

  // Clipboard paste
  function handleFormPaste(e: React.ClipboardEvent<HTMLFormElement>) {
    const imageItems = Array.from(e.clipboardData?.items ?? []).filter((i) =>
      i.type.startsWith("image/"),
    );
    if (!imageItems.length) return;
    e.preventDefault();
    const files: File[] = [];
    for (const item of imageItems) {
      const blob = item.getAsFile();
      if (!blob) continue;
      const ext = item.type.split("/")[1] ?? "png";
      const ts  = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      files.push(new File([blob], `paste-${ts}.${ext}`, { type: item.type }));
    }
    if (!files.length) return;
    screenshotUploadRef.current?.addFiles(files);
    setPasteNotice(true);
    if (pasteTimerRef.current) clearTimeout(pasteTimerRef.current);
    pasteTimerRef.current = setTimeout(() => setPasteNotice(false), 2000);
  }

  // Submit with upload pre-flight
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (nativeSubmitRef.current) { nativeSubmitRef.current = false; return; }
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
          setUploadError(typeof payload?.error === "string" ? payload.error : "Upload failed.");
          return;
        }
        screenshotsMeta = Array.isArray(payload.files)       ? payload.files       : [];
        attachmentsMeta = Array.isArray(payload.attachments) ? payload.attachments : [];
      } catch {
        setUploadError("Upload is temporarily unavailable. Please retry.");
        return;
      }
    }

    if (screenshotsMetaRef.current)
      screenshotsMetaRef.current.value = JSON.stringify(screenshotsMeta);
    if (attachmentsMetaRef.current)
      attachmentsMetaRef.current.value = JSON.stringify(attachmentsMeta);

    nativeSubmitRef.current = true;
    startTransition(() => { form.requestSubmit(); });
  }

  if (!canEdit && !canDelete) return null;

  return (
    <section id="edit-section" aria-label="Issue actions" className="space-y-2">
      {/* Action buttons row */}
      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <Button
            type="button"
            variant={open ? "secondary" : "outline"}
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => setOpen((v) => !v)}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            {open ? "Close editor" : "Update issue"}
          </Button>
        )}
        {canDelete && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/50"
            onClick={() => {
              if (!confirm("Delete this issue and all related data? This cannot be undone.")) return;
              startTransition(() => { deleteIssue(issueId); });
            }}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete
          </Button>
        )}
      </div>

      {/* Inline edit form */}
      {canEdit && open ? (
        <Card className="overflow-hidden border-border/70">
          <CardHeader className="border-b border-border/60 bg-muted/20 px-4 py-3">
            <CardTitle className="text-sm font-semibold">Update issue</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <form
              className="space-y-4"
              action={(fd) => { startTransition(() => { updateIssue(issueId, fd); }); }}
              onSubmit={onSubmit}
              onPaste={handleFormPaste}
            >
              {/* Hidden evidence meta inputs */}
              <input ref={screenshotsMetaRef} type="hidden" name="newScreenshotsMeta" defaultValue="[]" />
              <input ref={attachmentsMetaRef} type="hidden" name="newAttachmentsMeta" defaultValue="[]" />

              {/* Upload error */}
              {uploadError && (
                <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {uploadError}
                </div>
              )}

              {/* Paste notice */}
              <div
                role="status"
                aria-live="polite"
                className={cn(
                  "flex items-center gap-2 overflow-hidden rounded-md border border-emerald-300/60 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-700 transition-all duration-200 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300",
                  pasteNotice ? "max-h-12 opacity-100" : "max-h-0 border-0 p-0 opacity-0",
                )}
              >
                <ImagePlus className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Screenshot pasted.
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="sb-title">Title</Label>
                <Input id="sb-title" name="title" required maxLength={255} defaultValue={initial.title} />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="sb-description">Description</Label>
                <Textarea id="sb-description" name="description" required rows={6} defaultValue={initial.description} className="resize-y" />
              </div>

              {/* Workflow fields */}
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sb-type">Type</Label>
                  <Select id="sb-type" name="type" required defaultValue={initial.type}>
                    <option value="BUG">Bug</option>
                    <option value="IMPROVEMENT">Improvement</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sb-priority">Priority</Label>
                  <Select id="sb-priority" name="priority" required defaultValue={initial.priority}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sb-severity">Severity</Label>
                  <Select id="sb-severity" name="severity" required defaultValue={initial.severity}>
                    <option value="MINOR">Minor</option>
                    <option value="MAJOR">Major</option>
                    <option value="CRITICAL">Critical</option>
                  </Select>
                </div>
                {isAdmin && (
                  <div className="space-y-1.5">
                    <Label htmlFor="sb-status">Status</Label>
                    <Select id="sb-status" name="status" required defaultValue={initial.status}>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="sb-assigneeId">Assigned to</Label>
                  <Select id="sb-assigneeId" name="assigneeId" defaultValue={initial.assigneeId ?? ""} disabled={!isAdmin}>
                    <option value="">Unassigned</option>
                    {assigneeOptions.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sb-url">URL (optional)</Label>
                  <Input id="sb-url" name="url" type="url" placeholder="https://…" defaultValue={initial.url ?? ""} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sb-sourceNotes">Context note (optional)</Label>
                  <Input id="sb-sourceNotes" name="sourceNotes" placeholder="Reported via…" defaultValue={initial.sourceNotes ?? ""} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sb-reportedAt">Date reported</Label>
                  <Input id="sb-reportedAt" name="reportedAt" type="date" defaultValue={initial.reportedAt} />
                </div>
              </div>

              {/* Evidence append */}
              <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Append evidence
                  <span className="ml-1.5 font-normal normal-case tracking-normal opacity-70">
                    — paste <kbd className="rounded border border-border/70 bg-muted/60 px-1 font-mono text-[10px]">Ctrl V</kbd>
                  </span>
                </p>
                <ScreenshotUpload ref={screenshotUploadRef} onChange={setScreenshotFiles} />
                <AttachmentUpload onChange={setAttachmentFiles} />
              </div>

              {/* Footer */}
              <div className="flex gap-2 border-t border-border/60 pt-3">
                <Button type="submit" size="sm" disabled={pending} className="flex-1">
                  {pending ? "Saving…" : "Save changes"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
