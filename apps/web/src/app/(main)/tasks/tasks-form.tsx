"use client";

/**
 * NewIssueForm
 *
 * Changes vs. previous version:
 *   - Global `onPaste` handler attached to the <form> element intercepts
 *     image binary blobs from the system clipboard and routes them to the
 *     ScreenshotUpload component via an imperative ref handle.
 *     Works when pasting from:
 *       • Snipping Tool / screenshot keys (PNG blob)
 *       • Browser screenshot extensions (PNG/JPEG blob)
 *       • Copy-image from any context menu
 *     Text paste is unaffected — the guard checks `item.type.startsWith("image/")`.
 *   - ScreenshotUpload receives a `ref` (ScreenshotUploadHandle) so files can
 *     be pushed into it without re-mounting the component.
 *   - Paste indicator: a transient "Screenshot pasted ✓" toast-style banner
 *     appears for 2 seconds to confirm the clipboard capture.
 *   - The <details> progressive-disclosure section is replaced by a
 *     controlled <div> with a toggle button so we can animate the expansion
 *     and avoid the native <details> keyboard quirks.
 */

import { useRef, useState, useTransition } from "react";
import { ImagePlus } from "lucide-react";

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
  const [pasteNotice, setPasteNotice] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const formRef            = useRef<HTMLFormElement>(null);
  const screenshotsMetaRef = useRef<HTMLInputElement>(null);
  const attachmentsMetaRef = useRef<HTMLInputElement>(null);
  const screenshotUploadRef = useRef<ScreenshotUploadHandle>(null);
  const nativeSubmitPendingRef = useRef(false);
  const pasteNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Clipboard paste handler ──────────────────────────────────────────────
  //
  // Attached to the <form> so it fires whenever focus is anywhere inside the
  // form (title input, description textarea, any field). This is the most
  // natural model: the user copies a screenshot, clicks anywhere in the form,
  // hits Ctrl+V, and the image appears in the Evidence section.
  //
  // Guards:
  //   - Only processes ClipboardItem entries with type startsWith("image/").
  //   - Ignores paste events with no image data so normal text paste is
  //     unaffected.
  //   - If multiple images are pasted at once (e.g. drag-selected) all are
  //     captured.
  function handleFormPaste(e: React.ClipboardEvent<HTMLFormElement>) {
    const items = Array.from(e.clipboardData?.items ?? []);
    const imageItems = items.filter((item) =>
      item.type.startsWith("image/"),
    );

    if (imageItems.length === 0) return;

    // Prevent the browser from pasting an <img> tag into contenteditable
    // areas or the textarea. We handle the image ourselves.
    e.preventDefault();

    const files: File[] = [];
    for (const item of imageItems) {
      const blob = item.getAsFile();
      if (!blob) continue;
      // Give pasted blobs a deterministic filename so the upload API receives
      // a proper filename rather than "image.png" for every paste.
      const ext = item.type.split("/")[1] ?? "png";
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      const named = new File([blob], `paste-${timestamp}.${ext}`, {
        type: item.type,
      });
      files.push(named);
    }

    if (files.length === 0) return;

    // Push into the ScreenshotUpload component via its imperative handle.
    screenshotUploadRef.current?.addFiles(files);

    // Show a transient confirmation banner.
    setPasteNotice(true);
    if (pasteNoticeTimerRef.current) clearTimeout(pasteNoticeTimerRef.current);
    pasteNoticeTimerRef.current = setTimeout(() => setPasteNotice(false), 2000);
  }

  // ── Submit handler ───────────────────────────────────────────────────────
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (nativeSubmitPendingRef.current) {
      nativeSubmitPendingRef.current = false;
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
        attachmentsMeta = Array.isArray(payload.attachments)
          ? payload.attachments
          : [];
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

    nativeSubmitPendingRef.current = true;
    startTransition(() => {
      formRef.current?.requestSubmit();
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="page-stack">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-muted/35 via-muted/10 to-transparent pb-3">
          <CardTitle className="text-xl">Report issue</CardTitle>
          <CardDescription>
            Capture what happened, where it happened, and who should own the
            fix.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 md:p-5">
          <form
            ref={formRef}
            className="space-y-4"
            action={action}
            onSubmit={onSubmit}
            onPaste={handleFormPaste}
          >
            <input
              ref={screenshotsMetaRef}
              type="hidden"
              name="screenshotsMeta"
              defaultValue="[]"
            />
            <input
              ref={attachmentsMetaRef}
              type="hidden"
              name="attachmentsMeta"
              defaultValue="[]"
            />

            {/* Server / upload errors */}
            {errorMessage ? (
              <div
                role="alert"
                className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {errorMessage}
              </div>
            ) : null}
            {uploadError ? (
              <div
                role="alert"
                className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {uploadError}
              </div>
            ) : null}

            {/* Paste confirmation banner */}
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

            {/* ── Main two-column grid ─────────────────────────────────── */}
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
              {/* Left: title, description, evidence */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Issue title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Example: Login fails after password reset"
                    required
                    maxLength={255}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">What happened?</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the issue, expected behavior, and what you observed."
                    required
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep this short and concrete. Include steps if possible.
                  </p>
                </div>

                {/* Evidence card */}
                <Card tone="soft" density="dense" className="border-border/70">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Evidence</CardTitle>
                    <CardDescription>
                      Add screenshots or files to help triage quickly. You can
                      also{" "}
                      <kbd className="rounded border border-border/70 bg-muted/60 px-1 font-mono text-[10px]">
                        Ctrl V
                      </kbd>{" "}
                      anywhere in this form to paste an image from clipboard.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/*
                      ref is passed so handleFormPaste can call
                      screenshotUploadRef.current.addFiles(files) to push
                      clipboard images into the component without re-mounting.
                    */}
                    <ScreenshotUpload
                      ref={screenshotUploadRef}
                      onChange={setScreenshotFiles}
                    />
                    <AttachmentUpload onChange={setAttachmentFiles} />
                  </CardContent>
                </Card>
              </div>

              {/* Right: metadata sidebar */}
              <aside className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-3 md:p-4">
                {/* Quick setup */}
                <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Quick setup
                  </h3>
                  <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        id="priority"
                        name="priority"
                        required
                        defaultValue="MEDIUM"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="assigneeId">Assign to</Label>
                      <Select
                        id="assigneeId"
                        name="assigneeId"
                        defaultValue=""
                      >
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

                {/* More details — controlled collapsible */}
                <div className="rounded-lg border border-border/70 bg-background/70">
                  <button
                    type="button"
                    onClick={() => setShowMoreDetails((v) => !v)}
                    aria-expanded={showMoreDetails}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
                  >
                    More details (optional)
                    <span
                      aria-hidden="true"
                      className={cn(
                        "text-[10px] transition-transform duration-150",
                        showMoreDetails ? "rotate-180" : "",
                      )}
                    >
                      ▾
                    </span>
                  </button>

                  {showMoreDetails ? (
                    <div className="space-y-4 border-t border-border/60 px-3 pb-3 pt-3">
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                        <div className="space-y-1.5">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            id="status"
                            name="status"
                            defaultValue="OPEN"
                            disabled={!isAdmin}
                          >
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Only admins can set status at creation time.
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="type">Type</Label>
                          <Select
                            id="type"
                            name="type"
                            required
                            defaultValue="BUG"
                          >
                            <option value="BUG">Bug</option>
                            <option value="IMPROVEMENT">Improvement</option>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                        <div className="space-y-1.5">
                          <Label htmlFor="severity">Severity</Label>
                          <Select
                            id="severity"
                            name="severity"
                            required
                            defaultValue="MINOR"
                          >
                            <option value="MINOR">Minor</option>
                            <option value="MAJOR">Major</option>
                            <option value="CRITICAL">Critical</option>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="reportedAt">Date reported</Label>
                          <Input
                            id="reportedAt"
                            name="reportedAt"
                            type="date"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="url">Page or feature URL</Label>
                        <Input
                          id="url"
                          name="url"
                          type="url"
                          placeholder="https://example.com/path"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="sourceNotes">Context note</Label>
                        <Input
                          id="sourceNotes"
                          name="sourceNotes"
                          placeholder="Example: Reported via support call"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Reported by (read-only) */}
                <div className="space-y-1.5 border-t border-border/60 pt-4">
                  <Label htmlFor="loggedByDisplay">Reported by</Label>
                  <Input
                    id="loggedByDisplay"
                    value={loggedByLabel}
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground">
                    Filled automatically from your account.
                  </p>
                </div>

                {/* Tip */}
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                  Tip: fill title and description first, then add details only
                  when needed. Paste a screenshot anywhere in the form with{" "}
                  <kbd className="rounded border border-border/70 bg-muted/60 px-1 font-mono text-[10px]">
                    Ctrl V
                  </kbd>
                  .
                </div>
              </aside>
            </div>

            {/* Submit */}
            <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
              <Button
                type="submit"
                disabled={pending}
                className="w-full md:w-auto"
              >
                {pending ? "Saving…" : "Create issue"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
