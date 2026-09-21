"use client";

/**
 * NewIssueFormDrawer
 *
 * A self-contained issue creation form designed to live inside the slide-over
 * drawer on /tasks. It reuses the same field layout and validation as
 * NewIssueForm (tasks-form.tsx) but differs in two ways:
 *
 *   1. Submit mechanism: instead of a Server Action that calls redirect(),
 *      it uses a fetch() call to the existing /api endpoint and invokes
 *      onSuccess() when the server confirms creation. This keeps the drawer
 *      open on validation errors and avoids a full page navigation.
 *
 *   2. Compactness: the two-column xl grid from the full-page form is replaced
 *      with a single-column stacked layout that fits comfortably in a 672px
 *      wide panel without horizontal scrolling.
 *
 * Clipboard paste and screenshot preview work identically to the full form
 * via the same ScreenshotUpload ref handle.
 */

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";

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

// ─── Types ────────────────────────────────────────────────────────────────────

type AssigneeOption = { id: string; label: string };

type UploadedFile = {
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function NewIssueFormDrawer({
  assignees,
  onSuccess,
}: {
  assignees: AssigneeOption[];
  /** Called after a successful server response so the drawer can close. */
  onSuccess: () => void;
}) {
  // Replace useTransition with plain useState so we fully own the pending flag.
  // useTransition wraps async work in React's concurrent scheduler which can
  // re-invoke the callback, causing duplicate POSTs when the form is submitted.
  const [pending, setPending] = useState(false);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [pasteNotice, setPasteNotice] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const formRef             = useRef<HTMLFormElement>(null);
  const screenshotsMetaRef  = useRef<HTMLInputElement>(null);
  const attachmentsMetaRef  = useRef<HTMLInputElement>(null);
  const screenshotUploadRef = useRef<ScreenshotUploadHandle>(null);
  const pasteTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Hard in-flight guard — prevents any re-entry regardless of React render cycles.
  const submittingRef       = useRef(false);

  // ── Clipboard paste ──────────────────────────────────────────────────────

  function handlePaste(e: React.ClipboardEvent<HTMLFormElement>) {
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

  // ── Submit ───────────────────────────────────────────────────────────────

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Hard guard: if a submission is already in flight, do nothing.
    // This is the primary defence against duplicate issues — it prevents
    // React concurrent-mode re-renders, double-clicks, and any other source
    // of re-entry from firing a second POST.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setPending(true);
    setUploadError("");
    setSubmitError("");

    const form = e.currentTarget;
    if (!form.reportValidity()) {
      submittingRef.current = false;
      setPending(false);
      return;
    }

    try {
      // ── 1. Upload files if any ──────────────────────────────────────────
      let screenshotsMeta: UploadedFile[] = [];
      let attachmentsMeta: UploadedFile[] = [];

      if (screenshotFiles.length > 0 || attachmentFiles.length > 0) {
        const fd = new FormData();
        screenshotFiles.forEach((f) => fd.append("screenshots", f));
        attachmentFiles.forEach((f) => fd.append("attachments", f));

        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        const uploadPayload = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          setUploadError(
            typeof uploadPayload?.error === "string"
              ? uploadPayload.error
              : "File upload failed. Please retry.",
          );
          return;
        }
        screenshotsMeta = Array.isArray(uploadPayload.files) ? uploadPayload.files : [];
        attachmentsMeta = Array.isArray(uploadPayload.attachments) ? uploadPayload.attachments : [];
      }

      // ── 2. Write meta into hidden inputs so FormData picks them up ──────
      if (screenshotsMetaRef.current)
        screenshotsMetaRef.current.value = JSON.stringify(screenshotsMeta);
      if (attachmentsMetaRef.current)
        attachmentsMetaRef.current.value = JSON.stringify(attachmentsMeta);

      // ── 3. POST issue — single fetch, no startTransition wrapper ────────
      const formData = new FormData(form);
      const res = await fetch("/api/issues", { method: "POST", body: formData });

      if (res.ok || res.status === 201) {
        onSuccess();
        return;
      }

      const payload = await res.json().catch(() => ({}));
      setSubmitError(
        typeof payload?.error === "string"
          ? payload.error
          : `Server error (${res.status}). Please try again.`,
      );
    } catch {
      setSubmitError("Could not reach the server. Check your connection.");
    } finally {
      // Always release the guard so the user can retry after an error.
      submittingRef.current = false;
      setPending(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onPaste={handlePaste}
      className="space-y-4"
      noValidate={false}
    >
      <input ref={screenshotsMetaRef} type="hidden" name="screenshotsMeta" defaultValue="[]" />
      <input ref={attachmentsMetaRef} type="hidden" name="attachmentsMeta" defaultValue="[]" />

      {/* Error banners */}
      {submitError ? (
        <div role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
          {submitError}
        </div>
      ) : null}
      {uploadError ? (
        <div role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
          {uploadError}
        </div>
      ) : null}

      {/* Paste confirmation */}
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

      {/* ── Core fields ───────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="drawer-title">Issue title <span aria-hidden="true" className="text-destructive">*</span></Label>
        <Input
          id="drawer-title"
          name="title"
          placeholder="e.g. Login fails after password reset"
          required
          maxLength={255}
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="drawer-description">What happened? <span aria-hidden="true" className="text-destructive">*</span></Label>
        <Textarea
          id="drawer-description"
          name="description"
          placeholder="Describe the issue, expected behavior, and steps to reproduce."
          required
          rows={5}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Keep it concrete. Include steps to reproduce if possible.
        </p>
      </div>

      {/* ── Quick fields row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="drawer-priority">Priority</Label>
          <Select id="drawer-priority" name="priority" required defaultValue="MEDIUM">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="drawer-type">Type</Label>
          <Select id="drawer-type" name="type" required defaultValue="BUG">
            <option value="BUG">Bug</option>
            <option value="IMPROVEMENT">Improvement</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="drawer-severity">Severity</Label>
          <Select id="drawer-severity" name="severity" required defaultValue="MINOR">
            <option value="MINOR">Minor</option>
            <option value="MAJOR">Major</option>
            <option value="CRITICAL">Critical</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="drawer-assigneeId">Assign to</Label>
          <Select id="drawer-assigneeId" name="assigneeId" defaultValue="">
            <option value="">Unassigned</option>
            {assignees.map((u) => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* ── Evidence ──────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Evidence
          <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground/70">
            — optional · paste <kbd className="rounded border border-border/70 bg-muted/60 px-1 font-mono text-[10px]">Ctrl V</kbd> anywhere
          </span>
        </p>
        <ScreenshotUpload ref={screenshotUploadRef} onChange={setScreenshotFiles} />
        <AttachmentUpload onChange={setAttachmentFiles} />
      </div>

      {/* ── Optional extras collapsible ────────────────────────────────────── */}
      <div className="rounded-lg border border-border/70 bg-background/70">
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
        >
          Optional details
          <span
            aria-hidden="true"
            className={cn("text-[10px] transition-transform duration-150", showMore && "rotate-180")}
          >
            ▾
          </span>
        </button>
        {showMore ? (
          <div className="space-y-3 border-t border-border/60 px-3 pb-3 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="drawer-url">Page or feature URL</Label>
              <Input id="drawer-url" name="url" type="url" placeholder="https://example.com/path" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="drawer-sourceNotes">Context note</Label>
              <Input
                id="drawer-sourceNotes"
                name="sourceNotes"
                placeholder="e.g. Reported via support call"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="drawer-reportedAt">Date reported</Label>
              <Input id="drawer-reportedAt" name="reportedAt" type="date" />
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Footer actions ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-t border-border/60 pt-4">
        <Button type="submit" disabled={pending} className="flex-1 sm:flex-none">
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Creating…
            </>
          ) : (
            "Create issue"
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          <kbd className="rounded border border-border/70 bg-muted/60 px-1 font-mono text-[10px]">Esc</kbd>
          {" "}to close without saving
        </p>
      </div>
    </form>
  );
}
