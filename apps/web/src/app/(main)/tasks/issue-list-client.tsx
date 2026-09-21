"use client";

/**
 * IssueListClient — enterprise data table
 *
 * All server-action wiring, optimistic update logic, bulk-action handling,
 * inline badge editing, and drawer plumbing are unchanged from v2.
 * This version only updates the visual layer:
 *
 *   - Table wrapped in a rounded border container with shadow-xs
 *   - Column headers: 10px uppercase muted labels, h-10 rows, bg-muted/40
 *   - ID column: neutral mono tag, no aggressive colour
 *   - Rows: hover:bg-muted/30 transition-colors, generous py-3 padding
 *   - Pagination footer rebuilt: "Showing X–Y of Z" on the left,
 *     Previous / Page N of M / Next controls on the right
 *   - Bulk action bar and drawer unchanged
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckSquare2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Square,
  Trash2,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";

import { MinimalBadge } from "@/app/(main)/tasks/minimal-badge";
import {
  StatusQuickActions,
  type QuickStatus,
} from "@/app/(main)/tasks/tasks-table-row-actions";
import {
  batchChangeStatus,
  batchChangePriority,
  batchDeleteIssues,
} from "@/app/(main)/tasks/tasks-bulk-actions";
import {
  changeIssueStatusInline,
  changeIssuePriorityInline,
} from "@/app/(main)/tasks/tasks-inline-actions";
import { InlineBadgeEdit } from "@/app/(main)/tasks/inline-badge-edit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ListIssue = {
  id: string;
  title: string;
  type: string;
  priority: string;
  severity: string;
  status: QuickStatus;
  createdAt: string;
  reportedAt: string | null;
  createdBy: string;
  assigneeId: string | null;
};

type UserMeta = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string): string {
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

const detailHintByKind = {
  type: "What kind of work it is",
  priority: "When this needs attention",
  severity: "How much this impacts users",
  status: "Where it is in the workflow",
} as const;

const STATUS_OPTIONS: { value: QuickStatus; label: string }[] = [
  { value: "OPEN",        label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED",    label: "Resolved" },
  { value: "CLOSED",      label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW",    label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH",   label: "High" },
];

// ─── Shared column header class ───────────────────────────────────────────────

const TH = "h-10 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/40";

// ─── BulkActionBar ────────────────────────────────────────────────────────────

function BulkActionBar({
  selectedCount,
  onClear,
  onBatchStatus,
  onBatchPriority,
  onBatchDelete,
  isPending,
}: {
  selectedCount: number;
  onClear: () => void;
  onBatchStatus: (status: string) => void;
  onBatchPriority: (priority: string) => void;
  onBatchDelete: () => void;
  isPending: boolean;
}) {
  const [statusOpen, setStatusOpen]     = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const statusRef   = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node))
        setStatusOpen(false);
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node))
        setPriorityOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      role="toolbar"
      aria-label={`Bulk actions for ${selectedCount} selected issue${selectedCount !== 1 ? "s" : ""}`}
      className={cn(
        "glass-float-bar",
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-3 px-5 py-3 rounded-2xl",
        "animate-in slide-in-from-bottom-3 duration-300 ease-out",
      )}
      style={{ maxWidth: "calc(100vw - 2rem)" }}
    >
      {/* Selection count */}
      <div className="flex items-center gap-2">
        <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/10 border border-primary/30 px-2 text-xs font-semibold text-primary tabular-nums">
          {selectedCount}
        </span>
        <span className="text-sm font-medium text-foreground/90">selected</span>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="ml-1 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="h-6 w-px bg-border/30" aria-hidden="true" />

      <div className="flex items-center gap-1.5">
        {/* Move to status */}
        <div ref={statusRef} className="relative">
          <Button
            type="button" variant="ghost" size="sm" disabled={isPending}
            className="h-7 gap-1.5 text-xs font-medium hover:bg-accent/60"
            onClick={() => { setStatusOpen((v) => !v); setPriorityOpen(false); }}
          >
            Move to
            <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
          </Button>
          {statusOpen && (
            <div
              className="glass-popover absolute bottom-full mb-1.5 right-0 min-w-[160px] overflow-hidden rounded-xl shadow-lg"
              role="menu" aria-label="Select target status"
            >
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value} type="button" role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => { onBatchStatus(opt.value); setStatusOpen(false); }}
                >
                  <MinimalBadge kind="status" value={opt.value} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Set priority */}
        <div ref={priorityRef} className="relative">
          <Button
            type="button" variant="ghost" size="sm" disabled={isPending}
            className="h-7 gap-1.5 text-xs font-medium hover:bg-accent/60"
            onClick={() => { setPriorityOpen((v) => !v); setStatusOpen(false); }}
          >
            Priority
            <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
          </Button>
          {priorityOpen && (
            <div
              className="glass-popover absolute bottom-full mb-1.5 right-0 min-w-[160px] overflow-hidden rounded-xl shadow-lg"
              role="menu" aria-label="Select target priority"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value} type="button" role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => { onBatchPriority(opt.value); setPriorityOpen(false); }}
                >
                  <MinimalBadge kind="priority" value={opt.value} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-border/30" aria-hidden="true" />

        {/* Delete */}
        <Button
          type="button" variant="ghost" size="sm" disabled={isPending}
          className="h-7 gap-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
          onClick={onBatchDelete}
        >
          {isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            : <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
          Delete
        </Button>
      </div>
    </div>
  );
}

// ─── QuickCreateDrawer ────────────────────────────────────────────────────────

function QuickCreateDrawer({
  isOpen,
  onClose,
  assignees,
}: {
  isOpen: boolean;
  onClose: () => void;
  assignees: { id: string; label: string }[];
}) {
  const router = useRouter();
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => firstFocusRef.current?.focus());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    }
    document.addEventListener("keydown", handler, { capture: true });
    return () => document.removeEventListener("keydown", handler, { capture: true });
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label="Create new issue">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-2xl flex-col border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-5 py-3.5">
          <div>
            <h2 className="text-base font-semibold text-foreground">Create issue</h2>
            <p className="text-xs text-muted-foreground">
              Or{" "}
              <Link href="/tasks/new" className="text-primary underline-offset-2 hover:underline" onClick={onClose}>
                open full page
              </Link>{" "}
              for more space.
            </p>
          </div>
          <button
            ref={firstFocusRef} type="button" onClick={onClose} aria-label="Close drawer"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <DrawerFormBridge
            assignees={assignees}
            onSuccess={() => { onClose(); router.refresh(); }}
          />
        </div>
      </div>
    </div>
  );
}

const NewIssueFormDrawer = dynamic(
  () => import("@/app/(main)/tasks/tasks-form-drawer").then((m) => m.NewIssueFormDrawer),
  { ssr: false, loading: () => <p className="text-sm text-muted-foreground">Loading form…</p> },
);

function DrawerFormBridge({ assignees, onSuccess }: { assignees: { id: string; label: string }[]; onSuccess: () => void }) {
  return <NewIssueFormDrawer assignees={assignees} onSuccess={onSuccess} />;
}

// ─── IssueListClient ──────────────────────────────────────────────────────────

export function IssueListClient({
  initialIssues,
  showDetails,
  canQuickStatus,
  canEditIssue,
  isAdmin,
  reporters,
  totalVisible,
  filteredTotal,
  currentPage,
  totalPages,
  assigneesForCreate = [],
}: {
  initialIssues: ListIssue[];
  showDetails: boolean;
  canQuickStatus: boolean;
  canEditIssue: boolean;
  isAdmin: boolean;
  reporters: UserMeta[];
  totalVisible: number;
  filteredTotal: number;
  currentPage: number;
  totalPages: number;
  assigneesForCreate?: { id: string; label: string }[];
}) {
  const [issues, setIssues]          = useState<ListIssue[]>(initialIssues);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen]  = useState(false);
  const [bulkError, setBulkError]    = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Sync on server re-render
  useEffect(() => {
    setIssues(initialIssues);
    setSelectedIds(new Set());
  }, [initialIssues]);

  // C hotkey → open drawer
  useEffect(() => {
    function onOpen() { setDrawerOpen(true); }
    window.addEventListener("issue-tracker:open-create-drawer", onOpen);
    return () => window.removeEventListener("issue-tracker:open-create-drawer", onOpen);
  }, []);

  // Escape → clear selection
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && selectedIds.size > 0) setSelectedIds(new Set());
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedIds]);

  // ── Selection ──────────────────────────────────────────────────────────────

  const allIds       = useMemo(() => issues.map((i) => i.id), [issues]);
  const allSelected  = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const someSelected = !allSelected && allIds.some((id) => selectedIds.has(id));

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(allIds));
  }

  // ── Optimistic helpers ─────────────────────────────────────────────────────

  function optimisticallyUpdateStatus(ids: Set<string>, nextStatus: QuickStatus) {
    setIssues((prev) => prev.map((i) => ids.has(i.id) ? { ...i, status: nextStatus } : i));
  }
  function optimisticallyUpdatePriority(ids: Set<string>, next: string) {
    setIssues((prev) => prev.map((i) => ids.has(i.id) ? { ...i, priority: next } : i));
  }
  function optimisticallyRemove(ids: Set<string>) {
    setIssues((prev) => prev.filter((i) => !ids.has(i.id)));
  }

  // ── Bulk actions ───────────────────────────────────────────────────────────

  function handleBatchStatus(nextStatus: string) {
    const snap = new Set(selectedIds);
    const snapIssues = issues.filter((i) => snap.has(i.id));
    setBulkError(null);
    optimisticallyUpdateStatus(snap, nextStatus as QuickStatus);
    setSelectedIds(new Set());
    startTransition(async () => {
      const result = await batchChangeStatus([...snap], nextStatus);
      if (!result.ok) {
        setIssues((prev) => prev.map((i) => {
          const orig = snapIssues.find((s) => s.id === i.id);
          return orig && snap.has(i.id) ? { ...i, status: orig.status } : i;
        }));
        setBulkError(result.error);
      }
    });
  }

  function handleBatchPriority(nextPriority: string) {
    const snap = new Set(selectedIds);
    const snapIssues = issues.filter((i) => snap.has(i.id));
    setBulkError(null);
    optimisticallyUpdatePriority(snap, nextPriority);
    setSelectedIds(new Set());
    startTransition(async () => {
      const result = await batchChangePriority([...snap], nextPriority);
      if (!result.ok) {
        setIssues((prev) => prev.map((i) => {
          const orig = snapIssues.find((s) => s.id === i.id);
          return orig && snap.has(i.id) ? { ...i, priority: orig.priority } : i;
        }));
        setBulkError(result.error);
      }
    });
  }

  function handleBatchDelete() {
    const count = selectedIds.size;
    if (!window.confirm(`Permanently delete ${count} issue${count !== 1 ? "s" : ""}? This cannot be undone.`)) return;
    const snap = new Set(selectedIds);
    const snapIssues = issues.filter((i) => snap.has(i.id));
    setBulkError(null);
    optimisticallyRemove(snap);
    setSelectedIds(new Set());
    startTransition(async () => {
      const result = await batchDeleteIssues([...snap]);
      if (!result.ok) {
        setIssues((prev) => {
          const existing = new Set(prev.map((i) => i.id));
          const toRestore = snapIssues.filter((i) => !existing.has(i.id));
          return [...prev, ...toRestore];
        });
        setBulkError(result.error);
      }
    });
  }

  // ── Per-row status change ──────────────────────────────────────────────────

  function handleStatusChange(issueId: string, nextStatus: QuickStatus | null, previousStatus: QuickStatus) {
    setIssues((prev) => prev.map((i) => i.id !== issueId ? i : { ...i, status: nextStatus ?? previousStatus }));
  }

  // ── Inline badge edits ─────────────────────────────────────────────────────

  const [pendingCells, setPendingCells] = useState<Set<string>>(new Set());

  function setCellPending(key: string, pending: boolean) {
    setPendingCells((prev) => {
      const next = new Set(prev);
      pending ? next.add(key) : next.delete(key);
      return next;
    });
  }

  function handleInlineStatus(issueId: string, nextStatus: string) {
    const key = `${issueId}:status`;
    const prev = issues.find((i) => i.id === issueId)?.status;
    if (!prev || nextStatus === prev) return;
    setIssues((p) => p.map((i) => i.id === issueId ? { ...i, status: nextStatus as QuickStatus } : i));
    setCellPending(key, true);
    startTransition(async () => {
      const result = await changeIssueStatusInline(issueId, nextStatus);
      setCellPending(key, false);
      if (!result.ok) setIssues((p) => p.map((i) => i.id === issueId ? { ...i, status: prev } : i));
    });
  }

  function handleInlinePriority(issueId: string, nextPriority: string) {
    const key = `${issueId}:priority`;
    const prev = issues.find((i) => i.id === issueId)?.priority;
    if (!prev || nextPriority === prev) return;
    setIssues((p) => p.map((i) => i.id === issueId ? { ...i, priority: nextPriority } : i));
    setCellPending(key, true);
    startTransition(async () => {
      const result = await changeIssuePriorityInline(issueId, nextPriority);
      setCellPending(key, false);
      if (!result.ok) setIssues((p) => p.map((i) => i.id === issueId ? { ...i, priority: prev } : i));
    });
  }

  // ── Column visibility ──────────────────────────────────────────────────────

  const showCheckboxColumn = isAdmin;
  const showActionsColumn  = canQuickStatus || issues.some((i) => canEditIssue && (isAdmin || i.status === "OPEN"));
  const tableColumnCount   =
    (showCheckboxColumn ? 1 : 0) +
    5 +
    (showActionsColumn ? 1 : 0) +
    (showDetails ? 2 : 0) +
    (isAdmin && showDetails ? 2 : 0);

  const reporterById = new Map<string, UserMeta>(reporters.map((u) => [u.id, u]));

  function getUserLabel(userId: string, fallback: string): string {
    const u = reporterById.get(userId);
    return u ? (u.name ?? u.email) : fallback;
  }

  function getRoleChip(userId: string) {
    const u = reporterById.get(userId);
    if (!u) return null;
    const label = u.role === "TESTER" ? "Tester" : u.role === "ADMIN" ? "Admin" : "User";
    return (
      <Badge variant="outline" className="ml-1.5 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide">
        {label}
      </Badge>
    );
  }

  // ── Pagination helpers ─────────────────────────────────────────────────────

  const pageSize        = filteredTotal > 0 ? Math.ceil(filteredTotal / Math.max(totalPages, 1)) : 0;
  const showingFrom     = filteredTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo       = Math.min(currentPage * pageSize, filteredTotal);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Bulk error banner */}
      {bulkError && (
        <div role="alert" className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <span>{bulkError}</span>
          <button type="button" onClick={() => setBulkError(null)} aria-label="Dismiss error" className="ml-3 opacity-70 hover:opacity-100">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* ── Table container ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
        <Table>
          <caption className="sr-only">
            Page {currentPage} of {totalPages} — {filteredTotal} filtered issues
            {selectedIds.size > 0 ? ` · ${selectedIds.size} selected` : ""}
          </caption>

          {/* ── Column headers ──────────────────────────────────────────── */}
          <TableHeader>
            <TableRow className="border-b border-border/60 hover:bg-transparent">
              {/* Master checkbox */}
              {showCheckboxColumn && (
                <TableHead scope="col" className={cn(TH, "w-10 px-3")}>
                  <button
                    type="button"
                    onClick={toggleAll}
                    aria-label={allSelected ? "Deselect all issues" : "Select all visible issues"}
                    className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {allSelected
                      ? <CheckSquare2 className="h-4 w-4 text-primary" aria-hidden="true" />
                      : someSelected
                        ? <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border-2 border-primary bg-primary/20" aria-hidden="true">
                            <span className="h-1.5 w-2.5 rounded-full bg-primary" />
                          </span>
                        : <Square className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </TableHead>
              )}

              <TableHead scope="col" className={cn(TH, "w-28")}>ID</TableHead>
              <TableHead scope="col" className={TH}>Title</TableHead>
              <TableHead scope="col" className={cn(TH, "hidden lg:table-cell w-28")}>Type</TableHead>
              <TableHead scope="col" className={cn(TH, "w-28")}>Priority</TableHead>
              <TableHead scope="col" className={cn(TH, "hidden xl:table-cell w-28")}>Severity</TableHead>
              <TableHead scope="col" className={cn(TH, "w-32")}>Status</TableHead>

              {showActionsColumn && (
                <TableHead scope="col" className={cn(TH, "w-12 text-right")}>
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
              {isAdmin && showDetails && (
                <TableHead scope="col" className={cn(TH, "hidden md:table-cell")}>Assignee</TableHead>
              )}
              {isAdmin && showDetails && (
                <TableHead scope="col" className={cn(TH, "hidden md:table-cell")}>Reporter</TableHead>
              )}
              {showDetails && (
                <TableHead scope="col" className={cn(TH, "hidden lg:table-cell w-36")}>Reported</TableHead>
              )}
              {showDetails && (
                <TableHead scope="col" className={cn(TH, "hidden lg:table-cell w-36")}>Created</TableHead>
              )}
            </TableRow>
          </TableHeader>

          {/* ── Rows ────────────────────────────────────────────────────── */}
          <TableBody>
            {issues.length > 0 ? (
              issues.map((issue) => {
                const isSelected       = selectedIds.has(issue.id);
                const canEditThisIssue = canEditIssue && (isAdmin || issue.status === "OPEN");
                const canShowActions   = canQuickStatus || canEditThisIssue;

                return (
                  <TableRow
                    key={issue.id}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(
                      "border-b border-border/50 transition-colors",
                      "hover:bg-muted/30 cursor-pointer",
                      isSelected && "bg-primary/5",
                    )}
                  >
                    {/* Checkbox */}
                    {showCheckboxColumn && (
                      <TableCell className="w-10 px-3 py-3">
                        <button
                          type="button"
                          onClick={() => toggleOne(issue.id)}
                          aria-label={isSelected ? `Deselect ${issue.title}` : `Select ${issue.title}`}
                          aria-pressed={isSelected}
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border transition-all",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border/60 bg-transparent hover:border-primary/60",
                          )}
                        >
                          {isSelected && <CheckSquare2 className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />}
                        </button>
                      </TableCell>
                    )}

                    {/* ID — neutral mono, no aggressive colour */}
                    <TableCell className="w-28 py-3 px-4">
                      <Link
                        href={`/tasks/${issue.id}`}
                        className="font-mono text-xs text-muted-foreground tabular-nums transition-colors hover:text-foreground"
                        title={issue.id}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {issue.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </TableCell>

                    {/* Title */}
                    <TableCell className="py-3 px-4">
                      <Link
                        href={`/tasks/${issue.id}`}
                        className="text-sm font-medium text-foreground transition-colors hover:text-primary line-clamp-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {issue.title}
                      </Link>
                      {/* Collapsed badges visible only below lg */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1 lg:hidden">
                        <MinimalBadge kind="status"    value={issue.status}   title={detailHintByKind.status} />
                        <MinimalBadge kind="priority"  value={issue.priority} title={detailHintByKind.priority} />
                        <MinimalBadge kind="type"      value={issue.type} />
                        <MinimalBadge kind="severity"  value={issue.severity} title={detailHintByKind.severity} />
                      </div>
                    </TableCell>

                    {/* Type */}
                    <TableCell className="hidden w-28 py-3 px-4 lg:table-cell">
                      <MinimalBadge kind="type" value={issue.type} />
                    </TableCell>

                    {/* Priority — inline-editable for admins */}
                    <TableCell className="w-28 py-3 px-4">
                      <InlineBadgeEdit
                        kind="priority"
                        value={issue.priority}
                        disabled={!canQuickStatus}
                        isPending={pendingCells.has(`${issue.id}:priority`)}
                        onChange={(next) => handleInlinePriority(issue.id, next)}
                        renderBadge={(val) => (
                          <MinimalBadge kind="priority" value={val} title={detailHintByKind.priority} />
                        )}
                      />
                    </TableCell>

                    {/* Severity — read-only */}
                    <TableCell className="hidden w-28 py-3 px-4 xl:table-cell">
                      <MinimalBadge kind="severity" value={issue.severity} title={detailHintByKind.severity} />
                    </TableCell>

                    {/* Status — inline-editable for admins */}
                    <TableCell className="w-32 py-3 px-4">
                      <InlineBadgeEdit
                        kind="status"
                        value={issue.status}
                        disabled={!canQuickStatus}
                        isPending={pendingCells.has(`${issue.id}:status`)}
                        onChange={(next) => handleInlineStatus(issue.id, next)}
                        renderBadge={(val) => (
                          <MinimalBadge kind="status" value={val} title={detailHintByKind.status} />
                        )}
                      />
                    </TableCell>

                    {/* Actions */}
                    {showActionsColumn && (
                      <TableCell className="w-12 py-3 px-2 text-right">
                        {canShowActions && (
                          <StatusQuickActions
                            issueId={issue.id}
                            currentStatus={issue.status}
                            editHref={`/tasks/${issue.id}#edit-section`}
                            allowStatusChange={canQuickStatus}
                            allowEdit={canEditThisIssue}
                            onStatusChange={handleStatusChange}
                          />
                        )}
                      </TableCell>
                    )}

                    {/* Assignee */}
                    {isAdmin && showDetails && (
                      <TableCell className="hidden py-3 px-4 md:table-cell">
                        {issue.assigneeId ? (
                          <div className="flex min-w-0 flex-wrap items-center">
                            <span className="truncate text-sm">{getUserLabel(issue.assigneeId, "Unknown")}</span>
                            {getRoleChip(issue.assigneeId)}
                          </div>
                        ) : (
                          <span className="text-sm italic text-muted-foreground/60">Unassigned</span>
                        )}
                      </TableCell>
                    )}

                    {/* Reporter */}
                    {isAdmin && showDetails && (
                      <TableCell className="hidden py-3 px-4 md:table-cell">
                        <div className="flex min-w-0 flex-wrap items-center">
                          <span className="truncate text-sm">{getUserLabel(issue.createdBy, "Unknown")}</span>
                          {getRoleChip(issue.createdBy)}
                        </div>
                      </TableCell>
                    )}

                    {/* Reported date */}
                    {showDetails && (
                      <TableCell className="hidden w-36 py-3 px-4 lg:table-cell">
                        <span className="font-mono text-xs text-muted-foreground">
                          {issue.reportedAt ? formatDate(issue.reportedAt) : "—"}
                        </span>
                      </TableCell>
                    )}

                    {/* Created date */}
                    {showDetails && (
                      <TableCell className="hidden w-36 py-3 px-4 lg:table-cell">
                        <span className="font-mono text-xs text-muted-foreground">
                          {formatDate(issue.createdAt)}
                        </span>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={tableColumnCount} className="py-16 text-center">
                  <div className="mx-auto max-w-xs space-y-1">
                    <p className="text-sm font-medium text-foreground">No issues match this view</p>
                    <p className="text-xs text-muted-foreground">
                      Clear the filters or create a new issue to get started.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* ── Pagination footer ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-4 py-2.5">
          {/* Left: count summary */}
          <p className="text-xs text-muted-foreground">
            {filteredTotal === 0 ? (
              "No issues"
            ) : (
              <>
                Showing{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {showingFrom}–{showingTo}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {filteredTotal}
                </span>{" "}
                issue{filteredTotal !== 1 ? "s" : ""}
                {filteredTotal < totalVisible && (
                  <span className="ml-1 text-muted-foreground/70">
                    (filtered from {totalVisible})
                  </span>
                )}
                {selectedIds.size > 0 && (
                  <span className="ml-2 font-medium text-primary">
                    · {selectedIds.size} selected
                  </span>
                )}
              </>
            )}
          </p>

          {/* Right: pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                disabled={currentPage <= 1}
              >
                <Link
                  href={currentPage > 1 ? `?page=${currentPage - 1}` : "#"}
                  aria-disabled={currentPage <= 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Prev
                </Link>
              </Button>

              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {currentPage} / {totalPages}
              </span>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                disabled={currentPage >= totalPages}
              >
                <Link
                  href={currentPage < totalPages ? `?page=${currentPage + 1}` : "#"}
                  aria-disabled={currentPage >= totalPages}
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Floating bulk action bar */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onClear={() => setSelectedIds(new Set())}
          onBatchStatus={handleBatchStatus}
          onBatchPriority={handleBatchPriority}
          onBatchDelete={handleBatchDelete}
          isPending={isPending}
        />
      )}

      {/* Quick-create slide-over drawer */}
      <QuickCreateDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        assignees={assigneesForCreate}
      />
    </>
  );
}
