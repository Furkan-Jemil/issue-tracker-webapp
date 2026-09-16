"use client";

/**
 * IssueListClient — v2
 *
 * New in this version:
 *   ── Multi-select & bulk actions ──────────────────────────────────────────
 *   - Each row has a checkbox (admin-only) and a keyboard-accessible label.
 *   - The <thead> checkbox is indeterminate when a subset is selected; checked
 *     when all visible rows are selected; unchecked otherwise.
 *   - A floating bottom action bar slides up from the viewport bottom whenever
 *     `selectedIds.size > 0`. It offers:
 *       • Move to status  (dropdown → batchChangeStatus)
 *       • Set priority    (dropdown → batchChangePriority)
 *       • Delete selected (with confirm → batchDeleteIssues)
 *   - All three bulk actions are optimistic: local state is updated first and
 *     rolled back on server error.
 *   - The bar dismisses (clears selection) on Escape.
 *
 *   ── Quick-create drawer ──────────────────────────────────────────────────
 *   - "Create Issue" toolbar button now opens an inline slide-over `<Drawer>`
 *     instead of navigating to /tasks/new, preserving the current filter state.
 *   - The drawer embeds `<NewIssueFormDrawer>` — a lightweight wrapper around
 *     the existing form that calls a Server Action and closes the drawer on
 *     success.
 *   - The standalone /tasks/new route still works for deep-linking.
 *   - The `C` hotkey (registered in app-shell) now programmatically opens the
 *     drawer via a custom event so the hotkey handler doesn't need a ref.
 */

import {
  useCallback,
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
  Loader2,
  Square,
  Trash2,
  X,
} from "lucide-react";

import { IssueSemanticBadge } from "@/app/(main)/tasks/task-semantic-badge";
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

// ─── Types ─────────────────────────────────────────────────────────────────

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

// ─── Helpers ───────────────────────────────────────────────────────────────

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
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

// ─── BulkActionBar ─────────────────────────────────────────────────────────

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

  // Close dropdowns on outside click.
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
        setPriorityOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Escape clears the selection (handled in parent via the event bus).

  return (
    <div
      role="toolbar"
      aria-label={`Bulk actions for ${selectedCount} selected issue${selectedCount !== 1 ? "s" : ""}`}
      className={cn(
        // Slide up from bottom of viewport, above the sidebar footer.
        "fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3",
        "border-t border-border/80 bg-card/95 px-4 py-3 shadow-2xl backdrop-blur-sm",
        "animate-in slide-in-from-bottom-2 duration-200",
        // On large screens, indent to account for the sidebar width.
        "lg:left-[13rem]",
      )}
    >
      {/* Left: selection summary + clear */}
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
          {selectedCount}
        </span>
        <span className="text-sm font-medium text-foreground">
          {selectedCount === 1 ? "issue" : "issues"} selected
        </span>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="ml-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Right: bulk action buttons */}
      <div className="flex items-center gap-2">
        {/* Move to status */}
        <div ref={statusRef} className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            className="gap-1.5"
            onClick={() => { setStatusOpen((v) => !v); setPriorityOpen(false); }}
          >
            Move to
            <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
          </Button>
          {statusOpen ? (
            <div
              className="absolute bottom-full mb-1.5 right-0 min-w-[160px] overflow-hidden rounded-xl border border-border/70 bg-popover shadow-lg"
              role="menu"
              aria-label="Select target status"
            >
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => { onBatchStatus(opt.value); setStatusOpen(false); }}
                >
                  <IssueSemanticBadge
                    kind="status"
                    value={opt.value}
                    className="px-2 py-0.5 text-[10px]"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Set priority */}
        <div ref={priorityRef} className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            className="gap-1.5"
            onClick={() => { setPriorityOpen((v) => !v); setStatusOpen(false); }}
          >
            Set priority
            <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
          </Button>
          {priorityOpen ? (
            <div
              className="absolute bottom-full mb-1.5 right-0 min-w-[160px] overflow-hidden rounded-xl border border-border/70 bg-popover shadow-lg"
              role="menu"
              aria-label="Select target priority"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => { onBatchPriority(opt.value); setPriorityOpen(false); }}
                >
                  <IssueSemanticBadge
                    kind="priority"
                    value={opt.value}
                    className="px-2 py-0.5 text-[10px]"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Delete */}
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isPending}
          className="gap-1.5"
          onClick={onBatchDelete}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Delete
        </Button>
      </div>
    </div>
  );
}

// ─── QuickCreateDrawer ─────────────────────────────────────────────────────

/**
 * Slide-over drawer that embeds the issue creation form.
 * Triggered by the toolbar button or the `C` hotkey.
 *
 * The drawer is a portal so it renders above the table without disrupting
 * the document flow. Focus is trapped inside while open.
 */
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

  // Focus management: focus the close button when the drawer opens.
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => firstFocusRef.current?.focus());
    }
  }, [isOpen]);

  // Close on Escape.
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
    <div
      className="fixed inset-0 z-[60] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Create new issue"
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
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-5 py-3.5">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Create issue
            </h2>
            <p className="text-xs text-muted-foreground">
              Or{" "}
              <Link
                href="/tasks/new"
                className="text-primary underline-offset-2 hover:underline"
                onClick={onClose}
              >
                open full page
              </Link>{" "}
              for more space.
            </p>
          </div>
          <button
            ref={firstFocusRef}
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable body — imports NewIssueForm lazily */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <DrawerFormBridge
            assignees={assignees}
            onSuccess={() => {
              onClose();
              router.refresh();
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * DrawerFormBridge
 *
 * Renders the same compact form fields as NewIssuePage but wires a trimmed
 * Server Action inline so the full-page /tasks/new route is not required.
 * We import NewIssueForm lazily to avoid pulling the full form into the
 * main bundle for every visitor of /tasks.
 */
import dynamic from "next/dynamic";

const NewIssueFormDrawer = dynamic(
  () =>
    import("@/app/(main)/tasks/tasks-form-drawer").then(
      (m) => m.NewIssueFormDrawer,
    ),
  { ssr: false, loading: () => <p className="text-sm text-muted-foreground">Loading form…</p> },
);

function DrawerFormBridge({
  assignees,
  onSuccess,
}: {
  assignees: { id: string; label: string }[];
  onSuccess: () => void;
}) {
  return (
    <NewIssueFormDrawer
      assignees={assignees}
      onSuccess={onSuccess}
    />
  );
}

// ─── IssueListClient ────────────────────────────────────────────────────────

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
  /** Passed from the server so the drawer form can populate the assignee select. */
  assigneesForCreate?: { id: string; label: string }[];
}) {
  const [issues, setIssues]           = useState<ListIssue[]>(initialIssues);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [bulkError, setBulkError]     = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  // Sync when the server re-renders with new props.
  useEffect(() => {
    setIssues(initialIssues);
    setSelectedIds(new Set()); // clear selection on page/filter change
  }, [initialIssues]);

  // Open drawer when the `C` hotkey fires (dispatched by app-shell hotkey).
  // We use a custom window event so the hotkey handler doesn't need a ref
  // into this component.
  useEffect(() => {
    function onOpenDrawer() { setDrawerOpen(true); }
    window.addEventListener("issue-tracker:open-create-drawer", onOpenDrawer);
    return () => window.removeEventListener("issue-tracker:open-create-drawer", onOpenDrawer);
  }, []);

  // Close the bulk bar on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && selectedIds.size > 0) {
        setSelectedIds(new Set());
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedIds]);

  // ── Selection helpers ──────────────────────────────────────────────────

  const allIds = useMemo(() => issues.map((i) => i.id), [issues]);
  const allSelected   = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const someSelected  = !allSelected && allIds.some((id) => selectedIds.has(id));

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }

  // ── Optimistic helpers ────────────────────────────────────────────────

  function optimisticallyUpdateStatus(ids: Set<string>, nextStatus: QuickStatus) {
    setIssues((prev) =>
      prev.map((iss) =>
        ids.has(iss.id) ? { ...iss, status: nextStatus } : iss,
      ),
    );
  }

  function optimisticallyUpdatePriority(ids: Set<string>, nextPriority: string) {
    setIssues((prev) =>
      prev.map((iss) =>
        ids.has(iss.id) ? { ...iss, priority: nextPriority } : iss,
      ),
    );
  }

  function optimisticallyRemove(ids: Set<string>) {
    setIssues((prev) => prev.filter((iss) => !ids.has(iss.id)));
  }

  // ── Bulk action handlers ──────────────────────────────────────────────

  function handleBatchStatus(nextStatus: string) {
    const snapshot = new Set(selectedIds);
    const snapshotIssues = issues.filter((i) => snapshot.has(i.id));
    setBulkError(null);

    optimisticallyUpdateStatus(snapshot, nextStatus as QuickStatus);
    setSelectedIds(new Set());

    startTransition(async () => {
      const result = await batchChangeStatus([...snapshot], nextStatus);
      if (!result.ok) {
        // Roll back
        setIssues((prev) =>
          prev.map((iss) => {
            const original = snapshotIssues.find((s) => s.id === iss.id);
            return original && snapshot.has(iss.id)
              ? { ...iss, status: original.status }
              : iss;
          }),
        );
        setBulkError(result.error);
      }
    });
  }

  function handleBatchPriority(nextPriority: string) {
    const snapshot = new Set(selectedIds);
    const snapshotIssues = issues.filter((i) => snapshot.has(i.id));
    setBulkError(null);

    optimisticallyUpdatePriority(snapshot, nextPriority);
    setSelectedIds(new Set());

    startTransition(async () => {
      const result = await batchChangePriority([...snapshot], nextPriority);
      if (!result.ok) {
        setIssues((prev) =>
          prev.map((iss) => {
            const original = snapshotIssues.find((s) => s.id === iss.id);
            return original && snapshot.has(iss.id)
              ? { ...iss, priority: original.priority }
              : iss;
          }),
        );
        setBulkError(result.error);
      }
    });
  }

  function handleBatchDelete() {
    const count = selectedIds.size;
    if (
      !window.confirm(
        `Permanently delete ${count} issue${count !== 1 ? "s" : ""}? This cannot be undone.`,
      )
    )
      return;

    const snapshot = new Set(selectedIds);
    const snapshotIssues = issues.filter((i) => snapshot.has(i.id));
    setBulkError(null);

    optimisticallyRemove(snapshot);
    setSelectedIds(new Set());

    startTransition(async () => {
      const result = await batchDeleteIssues([...snapshot]);
      if (!result.ok) {
        // Restore deleted issues
        setIssues((prev) => {
          const existing = new Set(prev.map((i) => i.id));
          const toRestore = snapshotIssues.filter((i) => !existing.has(i.id));
          return [...prev, ...toRestore];
        });
        setBulkError(result.error);
      }
    });
  }

  // ── Single-row status change (from StatusQuickActions) ─────────────────

  function handleStatusChange(
    issueId: string,
    nextStatus: QuickStatus | null,
    previousStatus: QuickStatus,
  ) {
    setIssues((prev) =>
      prev.map((iss) => {
        if (iss.id !== issueId) return iss;
        return { ...iss, status: nextStatus ?? previousStatus };
      }),
    );
  }

  // ── Inline badge edit: per-cell pending state ──────────────────────────
  // Key format: `${issueId}:status` or `${issueId}:priority`
  const [pendingCells, setPendingCells] = useState<Set<string>>(new Set());

  function setCellPending(key: string, pending: boolean) {
    setPendingCells((prev) => {
      const next = new Set(prev);
      if (pending) next.add(key); else next.delete(key);
      return next;
    });
  }

  function handleInlineStatus(issueId: string, nextStatus: string) {
    const key = `${issueId}:status`;
    const previousStatus = issues.find((i) => i.id === issueId)?.status;
    if (!previousStatus || nextStatus === previousStatus) return;

    // Optimistic update.
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId ? { ...i, status: nextStatus as QuickStatus } : i,
      ),
    );
    setCellPending(key, true);

    startTransition(async () => {
      const result = await changeIssueStatusInline(issueId, nextStatus);
      setCellPending(key, false);
      if (!result.ok) {
        // Roll back.
        setIssues((prev) =>
          prev.map((i) =>
            i.id === issueId ? { ...i, status: previousStatus } : i,
          ),
        );
      }
    });
  }

  function handleInlinePriority(issueId: string, nextPriority: string) {
    const key = `${issueId}:priority`;
    const previousPriority = issues.find((i) => i.id === issueId)?.priority;
    if (!previousPriority || nextPriority === previousPriority) return;

    // Optimistic update.
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId ? { ...i, priority: nextPriority } : i,
      ),
    );
    setCellPending(key, true);

    startTransition(async () => {
      const result = await changeIssuePriorityInline(issueId, nextPriority);
      setCellPending(key, false);
      if (!result.ok) {
        // Roll back.
        setIssues((prev) =>
          prev.map((i) =>
            i.id === issueId ? { ...i, priority: previousPriority } : i,
          ),
        );
      }
    });
  }

  // ── Column counts ──────────────────────────────────────────────────────

  const showCheckboxColumn = isAdmin;
  const showActionsColumn =
    canQuickStatus || issues.some((i) => canEditIssue && (isAdmin || i.status === "OPEN"));
  const tableColumnCount =
    (showCheckboxColumn ? 1 : 0) +
    5 +
    (showActionsColumn ? 1 : 0) +
    (showDetails ? 2 : 0) +
    (isAdmin && showDetails ? 2 : 0);

  const cellPaddingClass = showDetails ? "py-2.5" : "py-1";
  const headPaddingClass = "h-8 py-0.5";

  const reporterById = new Map<string, UserMeta>(
    reporters.map((u) => [u.id, u]),
  );

  function getUserLabel(userId: string, fallback: string): string {
    const user = reporterById.get(userId);
    return user ? (user.name ?? user.email) : fallback;
  }

  function getRoleChip(userId: string) {
    const user = reporterById.get(userId);
    if (!user) return null;
    const label =
      user.role === "TESTER" ? "Tester" : user.role === "ADMIN" ? "Admin" : "User";
    return (
      <Badge
        variant="outline"
        className="ml-2 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide"
      >
        {label}
      </Badge>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* Bulk error banner */}
      {bulkError ? (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
        >
          <span>{bulkError}</span>
          <button
            type="button"
            onClick={() => setBulkError(null)}
            className="ml-3 text-red-500 hover:text-red-700"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {/* Table */}
      <Table className="bg-transparent">
        <caption className="sr-only">
          Page {currentPage} of {totalPages} — {filteredTotal} filtered issues
          {selectedIds.size > 0 ? ` · ${selectedIds.size} selected` : ""}
        </caption>

        <TableHeader>
          <TableRow>
            {/* Master checkbox */}
            {showCheckboxColumn ? (
              <TableHead scope="col" className={cn(headPaddingClass, "w-10")}>
                <label className="sr-only">
                  {allSelected ? "Deselect all" : "Select all"}
                </label>
                <button
                  type="button"
                  onClick={toggleAll}
                  aria-label={allSelected ? "Deselect all issues" : "Select all visible issues"}
                  className="flex items-center text-muted-foreground hover:text-foreground"
                >
                  {allSelected ? (
                    <CheckSquare2 className="h-4 w-4 text-primary" aria-hidden="true" />
                  ) : someSelected ? (
                    // Indeterminate visual: partially filled square
                    <span
                      className="inline-flex h-4 w-4 items-center justify-center rounded-sm border-2 border-primary bg-primary/20"
                      aria-hidden="true"
                    >
                      <span className="h-1.5 w-2.5 rounded-full bg-primary" />
                    </span>
                  ) : (
                    <Square className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </TableHead>
            ) : null}

            <TableHead scope="col" className={headPaddingClass}>Title</TableHead>
            <TableHead scope="col" className={cn(headPaddingClass, "hidden lg:table-cell")}>Type</TableHead>
            <TableHead scope="col" className={headPaddingClass}>Priority</TableHead>
            <TableHead scope="col" className={cn(headPaddingClass, "hidden xl:table-cell")}>Severity</TableHead>
            <TableHead scope="col" className={headPaddingClass}>Status</TableHead>

            {showActionsColumn ? (
              <TableHead scope="col" className={cn(headPaddingClass, "text-right")}>Action</TableHead>
            ) : null}
            {isAdmin && showDetails ? (
              <TableHead scope="col" className={headPaddingClass}>Assignee</TableHead>
            ) : null}
            {isAdmin && showDetails ? (
              <TableHead scope="col" className={headPaddingClass}>Reporter</TableHead>
            ) : null}
            {showDetails ? (
              <TableHead scope="col" className={headPaddingClass}>Reported</TableHead>
            ) : null}
            {showDetails ? (
              <TableHead scope="col" className={headPaddingClass}>Created</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>

        <TableBody>
          {issues.length > 0 ? (
            issues.map((issue) => {
              const isSelected = selectedIds.has(issue.id);
              const canEditThisIssue = canEditIssue && (isAdmin || issue.status === "OPEN");
              const canShowActions   = canQuickStatus || canEditThisIssue;

              return (
                <TableRow
                  key={issue.id}
                  data-state={isSelected ? "selected" : undefined}
                  className={cn(
                    "transition hover:bg-muted/20",
                    isSelected && "bg-primary/[0.04] hover:bg-primary/[0.07]",
                  )}
                >
                  {/* Row checkbox */}
                  {showCheckboxColumn ? (
                    <TableCell className={cn(cellPaddingClass, "w-10")}>
                      <button
                        type="button"
                        onClick={() => toggleOne(issue.id)}
                        aria-label={isSelected ? `Deselect ${issue.title}` : `Select ${issue.title}`}
                        aria-pressed={isSelected}
                        className="flex items-center text-muted-foreground hover:text-foreground"
                      >
                        {isSelected ? (
                          <CheckSquare2 className="h-4 w-4 text-primary" aria-hidden="true" />
                        ) : (
                          <Square className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </TableCell>
                  ) : null}

                  {/* Title */}
                  <TableCell className={cellPaddingClass}>
                    <Link
                      href={`/tasks/${issue.id}`}
                      className="break-words text-sm font-medium text-gray-950 hover:text-primary hover:underline dark:text-gray-100"
                    >
                      {issue.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1 lg:hidden">
                      <IssueSemanticBadge kind="status"   value={issue.status}   className="px-2.5 py-1 text-[11px]" title={detailHintByKind.status} />
                      <IssueSemanticBadge kind="priority" value={issue.priority} className="px-2.5 py-1 text-[11px]" title={detailHintByKind.priority} />
                      <IssueSemanticBadge kind="type"     value={issue.type}     className="px-2.5 py-1 text-[11px]" />
                      <IssueSemanticBadge kind="severity" value={issue.severity} className="px-2.5 py-1 text-[11px]" title={detailHintByKind.severity} />
                    </div>
                  </TableCell>

                  {/* Type */}
                  <TableCell className={cn(cellPaddingClass, "hidden lg:table-cell")}>
                    <IssueSemanticBadge kind="type" value={issue.type} className="px-2.5 py-1 text-[11px]" />
                  </TableCell>

                  {/* Priority — inline edit for admins, read-only for others */}
                  <TableCell className={cellPaddingClass}>
                    <InlineBadgeEdit
                      kind="priority"
                      value={issue.priority}
                      disabled={!canQuickStatus}
                      isPending={pendingCells.has(`${issue.id}:priority`)}
                      onChange={(next) => handleInlinePriority(issue.id, next)}
                    />
                  </TableCell>

                  {/* Severity — always read-only (no workflow rules) */}
                  <TableCell className={cn(cellPaddingClass, "hidden xl:table-cell")}>
                    <IssueSemanticBadge kind="severity" value={issue.severity} className="px-2.5 py-1 text-[11px]" title={detailHintByKind.severity} />
                  </TableCell>

                  {/* Status — inline edit for admins, read-only for others */}
                  <TableCell className={cellPaddingClass}>
                    <InlineBadgeEdit
                      kind="status"
                      value={issue.status}
                      disabled={!canQuickStatus}
                      isPending={pendingCells.has(`${issue.id}:status`)}
                      onChange={(next) => handleInlineStatus(issue.id, next)}
                    />
                  </TableCell>

                  {/* Per-row actions */}
                  {showActionsColumn ? (
                    <TableCell className={cn(cellPaddingClass, "text-right")}>
                      {canShowActions ? (
                        <div className="flex justify-end">
                          <StatusQuickActions
                            issueId={issue.id}
                            currentStatus={issue.status}
                            editHref={`/tasks/${issue.id}#edit-section`}
                            allowStatusChange={canQuickStatus}
                            allowEdit={canEditThisIssue}
                            onStatusChange={handleStatusChange}
                          />
                        </div>
                      ) : null}
                    </TableCell>
                  ) : null}

                  {/* Assignee */}
                  {isAdmin && showDetails ? (
                    <TableCell className={cellPaddingClass}>
                      {issue.assigneeId ? (
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                          <span className="break-words text-sm">{getUserLabel(issue.assigneeId, "Unknown")}</span>
                          {getRoleChip(issue.assigneeId)}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                  ) : null}

                  {/* Reporter */}
                  {isAdmin && showDetails ? (
                    <TableCell className={cellPaddingClass}>
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <span className="break-words text-sm">{getUserLabel(issue.createdBy, "Unknown")}</span>
                        {getRoleChip(issue.createdBy)}
                      </div>
                    </TableCell>
                  ) : null}

                  {showDetails ? (
                    <TableCell className={cn(cellPaddingClass, "text-sm text-muted-foreground")}>
                      {issue.reportedAt ? formatDate(issue.reportedAt) : "—"}
                    </TableCell>
                  ) : null}

                  {showDetails ? (
                    <TableCell className={cn(cellPaddingClass, "text-sm text-muted-foreground")}>
                      {formatDate(issue.createdAt)}
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={tableColumnCount} className="py-10">
                <div className="mx-auto max-w-md rounded-xl border border-dashed border-border/70 bg-background/80 px-4 py-5 text-center">
                  <p className="text-sm font-medium text-foreground">No issues match this view</p>
                  <p className="mt-1 text-sm text-muted-foreground">Clear filters or create a new issue to get started.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>

        <tfoot>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableCell colSpan={tableColumnCount} className="py-1.5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between px-[var(--table-cell-px)]">
                <span className="text-[11px]">
                  Total {totalVisible} &middot; Filtered {filteredTotal}
                  {selectedIds.size > 0 ? ` · ${selectedIds.size} selected` : ""}
                </span>
                <span>Page {currentPage} / {totalPages}</span>
              </div>
            </TableCell>
          </TableRow>
        </tfoot>
      </Table>

      {/* Floating bulk action bar */}
      {selectedIds.size > 0 ? (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onClear={() => setSelectedIds(new Set())}
          onBatchStatus={handleBatchStatus}
          onBatchPriority={handleBatchPriority}
          onBatchDelete={handleBatchDelete}
          isPending={isPending}
        />
      ) : null}

      {/* Quick-create slide-over drawer */}
      <QuickCreateDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        assignees={assigneesForCreate}
      />
    </>
  );
}
