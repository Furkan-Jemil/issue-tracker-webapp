"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFilters } from "@/lib/useFilters";
import { CalendarRange, Check, Filter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";

type ReporterOption = {
  id: string;
  label: string;
  role: string;
};

export function IssuesFilterPopover({
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
  onResetHref,
}: {
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
  // Legacy — kept for backwards compat but no longer used for view cycling
  view?: "compact" | "details" | "board";
}) {
  const router = useRouter();

  const {
    drafts,
    setField,
    apply,
    clear,
    isOpen,
    setIsOpen,
  } = useFilters(
    {
      q: query,
      createdFrom,
      createdTo,
      status,
      priority,
      severity,
      reporter,
      assignee,
    },
    {
      onApply: (d) => {
        const params = new URLSearchParams({ page: "1" });
        if (query) params.set("q", query);
        if (d.status) params.set("status", d.status);
        if (d.priority) params.set("priority", d.priority);
        if (d.severity) params.set("severity", d.severity);
        if (d.reporter) params.set("reporter", d.reporter);
        if (d.assignee) params.set("assignee", d.assignee);
        if (d.createdFrom) params.set("createdFrom", d.createdFrom);
        if (d.createdTo) params.set("createdTo", d.createdTo);
        router.push(`/tasks?${params.toString()}`);
        setIsOpen(false);
      },
    },
  );

  const reporterOptions = useMemo(() => reporters, [reporters]);

  const selectedStatus = drafts.status ?? "";
  const selectedPriority = drafts.priority ?? "";
  const selectedSeverity = drafts.severity ?? "";
  const selectedReporter = drafts.reporter ?? "";
  const selectedAssignee = drafts.assignee ?? "";
  const selectedCreatedFrom = drafts.createdFrom ?? "";
  const selectedCreatedTo = drafts.createdTo ?? "";

  const hasPendingChanges =
    (drafts.status ?? "") !== status ||
    (drafts.priority ?? "") !== priority ||
    (drafts.severity ?? "") !== severity ||
    (drafts.reporter ?? "") !== reporter ||
    (drafts.assignee ?? "") !== assignee ||
    (drafts.createdFrom ?? "") !== createdFrom ||
    (drafts.createdTo ?? "") !== createdTo;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="relative h-9 gap-1.5 rounded-lg border-border bg-background px-2.5 text-xs"
          aria-label="Open filters"
          title="Filters">
          <Filter className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <Badge
              variant="secondary"
              className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full px-1 py-0 text-[9px] font-bold">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        id="issues-filter-popover"
        className="filter-popup w-80 p-0 shadow-xl animate-in fade-in-0 zoom-in-95"
        align="end"
        sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-semibold">Filter Issues</p>
            {hasActiveFilters && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Check className="h-3 w-3" aria-hidden="true" />
                {activeFilterCount} active
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => { clear(); router.push(onResetHref); setIsOpen(false); }}>
              Reset all
            </Button>
          )}
        </div>

        {/* Body */}
        <div className="space-y-3 p-4">
          {isAdmin && (
            <>
              <Select
                id="issues-status-filter"
                name="status"
                value={selectedStatus}
                onValueChange={(v) => setField("status", v)}
                className="h-9 rounded-lg text-xs">
                <option value="">All statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </Select>

              <Select
                id="issues-priority-filter"
                name="priority"
                value={selectedPriority}
                onValueChange={(v) => setField("priority", v)}
                className="h-9 rounded-lg text-xs">
                <option value="">All priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </Select>

              <Select
                id="issues-severity-filter"
                name="severity"
                value={selectedSeverity}
                onValueChange={(v) => setField("severity", v)}
                className="h-9 rounded-lg text-xs">
                <option value="">All severities</option>
                <option value="MINOR">Minor</option>
                <option value="MAJOR">Major</option>
                <option value="CRITICAL">Critical</option>
              </Select>

              <Select
                id="issues-reporter-filter"
                name="reporter"
                value={selectedReporter}
                onValueChange={(v) => setField("reporter", v)}
                className="h-9 rounded-lg text-xs">
                <option value="">All reporters</option>
                {reporterOptions.map((u) => (
                  <option key={u.id} value={u.id}>{u.label}</option>
                ))}
              </Select>

              <Select
                id="issues-assignee-filter"
                name="assignee"
                value={selectedAssignee}
                onValueChange={(v) => setField("assignee", v)}
                className="h-9 rounded-lg text-xs">
                <option value="">All assignees</option>
                {reporterOptions.map((u) => (
                  <option key={u.id} value={u.id}>{u.label}</option>
                ))}
              </Select>
            </>
          )}

          {/* Date range: side-by-side on one row */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" />
              Date range
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="issues-created-from"
                type="date"
                value={selectedCreatedFrom}
                onChange={(e) => setField("createdFrom", e.target.value)}
                className="h-9 flex-1 rounded-lg text-xs"
                aria-label="Created from"
              />
              <span className="shrink-0 text-muted-foreground" aria-hidden="true">→</span>
              <Input
                id="issues-created-to"
                type="date"
                value={selectedCreatedTo}
                onChange={(e) => setField("createdTo", e.target.value)}
                className="h-9 flex-1 rounded-lg text-xs"
                aria-label="Created to"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border/60 px-4 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-xs"
            onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-lg text-xs"
            disabled={!hasPendingChanges}
            onClick={() => apply()}>
            Apply filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
