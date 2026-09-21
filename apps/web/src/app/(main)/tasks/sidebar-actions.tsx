"use client";

/**
 * SidebarActions
 *
 * Renders two buttons in the sidebar rail:
 *   - "Edit issue"  → opens a right-side slide-over panel with the full form
 *   - "Delete"      → confirm → deleteIssue server action (admin only)
 *
 * The edit panel slides in from the right at max-w-2xl, exactly like the
 * quick-create drawer, giving the form full breathing room instead of trying
 * to squeeze it into a 260px sidebar column.
 */

import { useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Pencil, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
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
type UploadedFile   = { url: string; filename: string; mimeType: string; sizeBytes: number };

// ─── Edit panel (slide-over) ──────────────────────────────────────────────────

function EditPanel({
  issueId,
  initial,
  isAdmin,
  assigneeOptions,
  onClose,
}: {
  issueId: string;
  initial: IssueInitial;
  isAdmin: boolean;
  assigneeOptions: AssigneeOption[];
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [uploadError, setUploadError]         = useState("");
  const [pasteNotice, setPasteNotice]         = useState(false);

  const screenshotsMetaRef  = useRef<HTMLInputElement>(null);
  const attachmentsMetaRef  = useRef<HTMLInputElement>(null);
  const screenshotUploadRef = useRef<ScreenshotUploadHandle>(null);
  const closeBtnRef         = useRef<HTMLButtonElement>(null);
  const pasteTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nativeSubmitRef     = useRef(false);

  // Focus close button on open
  useEffect(() => {
    requestAnimationFrame(() => closeBtnRef.current?.focus());
  }, []);

  // Escape closes
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    }
    document.addEventListener("keydown", handler, { capture: true });
    return () => document.removeEventListener("keydown", handler, { capture: true });
  }, [onClose]);

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

  // Submit with upload pre-flight then requestSubmit → Server Action
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
        const res     = await fetch("/api/upload", { method: "POST", body: fd });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          setUploadError(typeof payload?.error === "string" ? payload.error : "File upload failed.");
          return;
        }
        screenshotsMeta = Array.isArray(payload.files)       ? payload.files       : [];
        attachmentsMeta = Array.isArray(payload.attachments) ? payload.attachments : [];
      } catch {
        setUploadError("Upload unavailable. Please retry.");
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

  return (
    /* Full-screen overlay */
    <div
      className="fixed inset-0 z-[60] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Edit issue"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative flex h-full w-full max-w-2xl flex-col border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-border/60 bg-muted/20 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Edit issue</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Update fields and save — changes apply immediately.{" "}
              <kbd className="rounded border border-border/70 bg-muted/60 px-1 font-mono text-[10px]">Esc</kbd>
              {" "}to close.
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close edit panel"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <form
            className="space-y-5"
            action={(fd) => { startTransition(() => { updateIssue(issueId, fd); }); }}
            onSubmit={onSubmit}
            onPaste={handleFormPaste}
          >
            {/* Hidden meta */}
            <input ref={screenshotsMetaRef} type="hidden" name="newScreenshotsMeta" defaultValue="[]" />
            <input ref={attachmentsMetaRef} type="hidden" name="newAttachmentsMeta" defaultValue="[]" />

            {/* Upload error */}
            {uploadError && (
              <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {uploadError}
              </div>
            )}

            {/* Paste notice */}
            <div
              role="status"
              aria-live="polite"
              className={cn(
                "flex items-center gap-2 overflow-hidden rounded-md border border-emerald-300/60 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-700 transition-all duration-200 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300",
                pasteNotice ? "max-h-12 opacity-100" : "max-h-0 border-0 p-0 opacity-0",
              )}
            >
              <ImagePlus className="h-4 w-4 shrink-0" aria-hidden />
              Screenshot pasted and staged for upload.
            </div>

            {/* ── Two-column grid — mirrors the new-issue form ─────────── */}
            <div className="grid gap-5 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">

              {/* Left: narrative */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ep-title">Title <span aria-hidden="true" className="text-destructive">*</span></Label>
                  <Input id="ep-title" name="title" required maxLength={255} defaultValue={initial.title} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ep-description">Description <span aria-hidden="true" className="text-destructive">*</span></Label>
                  <Textarea
                    id="ep-description"
                    name="description"
                    required
                    rows={10}
                    defaultValue={initial.description}
                    className="resize-y text-sm leading-relaxed"
                  />
                </div>

                {/* Evidence */}
                <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Append evidence
                    <span className="ml-1.5 font-normal normal-case tracking-normal opacity-70">
                      — paste{" "}
                      <kbd className="rounded border border-border/70 bg-muted/60 px-1 font-mono text-[10px]">
                        Ctrl V
                      </kbd>{" "}
                      anywhere
                    </span>
                  </p>
                  <ScreenshotUpload ref={screenshotUploadRef} onChange={setScreenshotFiles} />
                  <AttachmentUpload onChange={setAttachmentFiles} />
                </div>
              </div>

              {/* Right: metadata */}
              <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Workflow
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="ep-type">Type</Label>
                  <Select id="ep-type" name="type" required defaultValue={initial.type}>
                    <option value="BUG">Bug</option>
                    <option value="IMPROVEMENT">Improvement</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ep-priority">Priority</Label>
                  <Select id="ep-priority" name="priority" required defaultValue={initial.priority}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ep-severity">Severity</Label>
                  <Select id="ep-severity" name="severity" required defaultValue={initial.severity}>
                    <option value="MINOR">Minor</option>
                    <option value="MAJOR">Major</option>
                    <option value="CRITICAL">Critical</option>
                  </Select>
                </div>

                {isAdmin && (
                  <div className="space-y-1.5">
                    <Label htmlFor="ep-status">Status</Label>
                    <Select id="ep-status" name="status" required defaultValue={initial.status}>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="ep-assigneeId">Assigned to</Label>
                  <Select
                    id="ep-assigneeId"
                    name="assigneeId"
                    defaultValue={initial.assigneeId ?? ""}
                    disabled={!isAdmin}
                  >
                    <option value="">Unassigned</option>
                    {assigneeOptions.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5 border-t border-border/50 pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Extra details
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ep-url">Reference URL</Label>
                  <Input
                    id="ep-url"
                    name="url"
                    type="url"
                    placeholder="https://…"
                    defaultValue={initial.url ?? ""}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ep-sourceNotes">Context note</Label>
                  <Input
                    id="ep-sourceNotes"
                    name="sourceNotes"
                    placeholder="e.g. Reported via support call"
                    defaultValue={initial.sourceNotes ?? ""}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ep-reportedAt">Date reported</Label>
                  <Input
                    id="ep-reportedAt"
                    name="reportedAt"
                    type="date"
                    defaultValue={initial.reportedAt}
                  />
                </div>
              </div>
            </div>

            {/* ── Sticky footer ──────────────────────────────────────────── */}
            <div className="flex items-center gap-3 border-t border-border/60 pt-4">
              <Button type="submit" disabled={pending} className="gap-1.5">
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
                Cancel
              </Button>
              <p className="ml-auto text-xs text-muted-foreground hidden sm:block">
                Changes apply immediately on this page.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── SidebarActions (outer wrapper) ──────────────────────────────────────────

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
  const [panelOpen, setPanelOpen]  = useState(false);
  const [pending, startTransition] = useTransition();

  // Support #edit-section deep-link (e.g. from the StatusQuickActions "Edit" button)
  useEffect(() => {
    if (!canEdit) return;
    function check() {
      if (window.location.hash === "#edit-section") setPanelOpen(true);
    }
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [canEdit]);

  if (!canEdit && !canDelete) return null;

  return (
    <section id="edit-section" aria-label="Issue actions" className="flex flex-wrap gap-2">
      {canEdit && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => setPanelOpen(true)}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit issue
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
          {pending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            : <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          }
          Delete
        </Button>
      )}

      {/* Slide-over edit panel — rendered in a portal above everything */}
      {panelOpen && (
        <EditPanel
          issueId={issueId}
          initial={initial}
          isAdmin={isAdmin}
          assigneeOptions={assigneeOptions}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </section>
  );
}
