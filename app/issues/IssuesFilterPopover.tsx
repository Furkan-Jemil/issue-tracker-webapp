"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Filter, Kanban, Rows3, StretchHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type ReporterOption = {
  id: string;
  label: string;
  role: string;
};

export function IssuesFilterPopover({
  view,
  isAdmin,
  hasActiveFilters,
  activeFilterCount,
  query,
  createdFrom,
  createdTo,
  status,
  priority,
  severity,
  reporter,
  assignee,
  reporters,
  onSubmitHref,
  onResetHref,
}: {
  view: "compact" | "details" | "board";
  isAdmin: boolean;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  query: string;
  createdFrom: string;
  createdTo: string;
  status: string;
  priority: string;
  severity: string;
  reporter: string;
  assignee: string;
  reporters: ReporterOption[];
  onSubmitHref: string;
  onResetHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [selectedView, setSelectedView] = useState(view);
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [selectedPriority, setSelectedPriority] = useState(priority);
  const [selectedSeverity, setSelectedSeverity] = useState(severity);
  const [selectedReporter, setSelectedReporter] = useState(reporter);
  const [selectedAssignee, setSelectedAssignee] = useState(assignee);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!open) return;
      const target = event.target as Node | null;
      if (target && containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const reporterOptions = useMemo(() => reporters, [reporters]);

  useEffect(() => {
    setSelectedView(view);
  }, [view]);

  useEffect(() => {
    setSelectedStatus(status);
  }, [status]);

  useEffect(() => {
    setSelectedPriority(priority);
  }, [priority]);

  useEffect(() => {
    setSelectedSeverity(severity);
  }, [severity]);

  useEffect(() => {
    setSelectedReporter(reporter);
  }, [reporter]);

  useEffect(() => {
    setSelectedAssignee(assignee);
  }, [assignee]);

  function cycleViewMode() {
    setSelectedView((current) => {
      if (current === "compact") return "details";
      if (current === "details") return "board";
      return "compact";
    });
    window.requestAnimationFrame(() => {
      const form = containerRef.current?.querySelector("form") as HTMLFormElement | null;
      form?.requestSubmit();
    });
  }

  const viewModeLabel =
    selectedView === "compact"
      ? "Compact"
      : selectedView === "details"
        ? "Detailed"
        : "Board";

  const ViewModeIcon =
    selectedView === "compact"
      ? Rows3
      : selectedView === "details"
        ? StretchHorizontal
        : Kanban;

  function submitFiltersSoon() {
    window.requestAnimationFrame(() => {
      const form = containerRef.current?.querySelector("form") as HTMLFormElement | null;
      form?.requestSubmit();
    });
  }

  return (
    <div ref={containerRef} className="relative z-40">
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        size="icon"
        className="relative h-9 w-9 rounded-md border-border bg-background"
        aria-label="Open filters"
        title="Filters"
        aria-expanded={open}
        aria-controls="issues-filter-popover"
        onClick={() => setOpen((current) => !current)}>
        <Filter className="h-4 w-4" aria-hidden="true" />
        {hasActiveFilters && (
          <Badge variant="secondary" className="absolute -right-1.5 -top-1 min-w-4 px-1 py-0 text-[10px]">
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      {open && (
        <div
          id="issues-filter-popover"
          className="popover-surface absolute left-0 top-11 z-[80] w-[min(90vw,300px)] rounded-lg border border-border bg-card p-2.5 shadow-md md:left-auto md:right-0">
          <form
            method="get"
            action={onSubmitHref}
            className="space-y-2"
            onSubmit={() => setOpen(false)}>
            <div className="flex items-center justify-between gap-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Filter
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={cycleViewMode}
                  aria-label={`View mode: ${viewModeLabel}. Click to switch mode.`}
                  title={`View mode: ${viewModeLabel}`}
                  className="h-7 w-7 rounded-md">
                  <ViewModeIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button type="submit" size="dense" className="h-7 rounded-md px-2 text-[11px]">
                  Apply
                </Button>
              </div>
            </div>
            {query ? <input type="hidden" name="q" value={query} /> : null}
            {createdFrom ? <input type="hidden" name="createdFrom" value={createdFrom} /> : null}
            {createdTo ? <input type="hidden" name="createdTo" value={createdTo} /> : null}
            <input type="hidden" name="view" value={selectedView} />

            {hasActiveFilters ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                <Check className="h-3 w-3" aria-hidden="true" />
                Active filters
              </span>
            ) : null}

            <div className="grid grid-cols-1 gap-1.5">
              {isAdmin && (
                <div className="grid grid-cols-1 gap-1.5">
                  <Select
                    id="issues-status-filter"
                    name="status"
                    value={selectedStatus}
                    onValueChange={(value) => {
                      setSelectedStatus(value);
                      submitFiltersSoon();
                    }}
                    className="h-8 rounded-md text-xs">
                    <option value="">All Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </Select>
                  <Select
                    id="issues-priority-filter"
                    name="priority"
                    value={selectedPriority}
                    onValueChange={(value) => {
                      setSelectedPriority(value);
                      submitFiltersSoon();
                    }}
                    className="h-8 rounded-md text-xs">
                    <option value="">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </Select>
                  <Select
                    id="issues-severity-filter"
                    name="severity"
                    value={selectedSeverity}
                    onValueChange={(value) => {
                      setSelectedSeverity(value);
                      submitFiltersSoon();
                    }}
                    className="h-8 rounded-md text-xs">
                    <option value="">All Severities</option>
                    <option value="MINOR">Minor</option>
                    <option value="MAJOR">Major</option>
                    <option value="CRITICAL">Critical</option>
                  </Select>
                  <Select
                    id="issues-reporter-filter"
                    name="reporter"
                    value={selectedReporter}
                    onValueChange={(value) => {
                      setSelectedReporter(value);
                      submitFiltersSoon();
                    }}
                    className="h-8 rounded-md text-xs">
                    <option value="">All Reporters</option>
                    {reporterOptions.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.label}
                      </option>
                    ))}
                  </Select>
                  <Select
                    id="issues-assignee-filter"
                    name="assignee"
                    value={selectedAssignee}
                    onValueChange={(value) => {
                      setSelectedAssignee(value);
                      submitFiltersSoon();
                    }}
                    className="h-8 rounded-md text-xs">
                    <option value="">All Assignees</option>
                    {reporterOptions.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.label}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-0.5">
              {hasActiveFilters && (
                <Button asChild variant="outline" size="dense" onClick={() => setOpen(false)} className="rounded-md">
                  <Link href={onResetHref}>Reset</Link>
                </Button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
