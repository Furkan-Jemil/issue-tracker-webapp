"use client";

import { useMemo } from "react";
import { CalendarRange, Check, Filter, Kanban, Rows3, StretchHorizontal } from "lucide-react";
import { useFilters } from "@/lib/useFilters";

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
  const { drafts, setField, apply, clear, isOpen, setIsOpen } = useFilters(
    {
      view,
      q: query,
      createdFrom,
      createdTo,
      status,
      priority,
      severity,
      reporter,
      assignee,
    },
    { onSubmitHref, onResetHref },
  );

  const selectedView      = drafts.view ?? view;
  const selectedStatus    = drafts.status ?? "";
  const selectedPriority  = drafts.priority ?? "";
  const selectedSeverity  = drafts.severity ?? "";
  const selectedReporter  = drafts.reporter ?? "";
  const selectedAssignee  = drafts.assignee ?? "";
  const selectedCreatedFrom = drafts.createdFrom ?? "";
  const selectedCreatedTo   = drafts.createdTo ?? "";

  const reporterOptions = useMemo(() => reporters, [reporters]);

  function cycleViewMode() {
    setField(
      "view",
      selectedView === "compact"
        ? "details"
        : selectedView === "details"
          ? "board"
          : "compact",
    );
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="relative h-8 gap-1.5 px-2.5"
          aria-label="Open filters"
        >
          <Filter className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <Badge
              variant="secondary"
              className="absolute -right-1.5 -top-1 min-w-[18px] px-1 py-0 text-[10px] font-semibold"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[min(92vw,320px)] p-3"
        align="end"
      >
        <form className="space-y-3" onSubmit={apply}>
          {/* Header row */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Filters
            </p>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={cycleViewMode}
              aria-label={`View mode: ${viewModeLabel}. Click to switch.`}
              title={`View mode: ${viewModeLabel}`}
              className="h-7 w-7"
            >
              <ViewModeIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>

          {/* Active-filter pill */}
          {hasActiveFilters && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <Check className="h-3 w-3" aria-hidden="true" />
              {activeFilterCount} active
            </span>
          )}

          <div className="space-y-2.5">
            {/* Date range */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label
                  htmlFor="filter-created-from"
                  className="flex items-center gap-1 text-[10px] text-muted-foreground"
                >
                  <CalendarRange className="h-3 w-3" aria-hidden="true" />
                  From
                </Label>
                <Input
                  id="filter-created-from"
                  type="date"
                  value={selectedCreatedFrom}
                  onChange={(e) => setField("createdFrom", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="filter-created-to"
                  className="text-[10px] text-muted-foreground"
                >
                  To
                </Label>
                <Input
                  id="filter-created-to"
                  type="date"
                  value={selectedCreatedTo}
                  onChange={(e) => setField("createdTo", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Status */}
            <Select
              id="filter-status"
              name="status"
              value={selectedStatus}
              onValueChange={(v) => setField("status", v)}
              className="h-8 text-xs"
            >
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </Select>

            {/* Priority */}
            <Select
              id="filter-priority"
              name="priority"
              value={selectedPriority}
              onValueChange={(v) => setField("priority", v)}
              className="h-8 text-xs"
            >
              <option value="">All priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>

            {/* Severity */}
            <Select
              id="filter-severity"
              name="severity"
              value={selectedSeverity}
              onValueChange={(v) => setField("severity", v)}
              className="h-8 text-xs"
            >
              <option value="">All severities</option>
              <option value="MINOR">Minor</option>
              <option value="MAJOR">Major</option>
              <option value="CRITICAL">Critical</option>
            </Select>

            {/* Admin-only: reporter + assignee */}
            {isAdmin && (
              <>
                <Select
                  id="filter-reporter"
                  name="reporter"
                  value={selectedReporter}
                  onValueChange={(v) => setField("reporter", v)}
                  className="h-8 text-xs"
                >
                  <option value="">All reporters</option>
                  {reporterOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label}
                    </option>
                  ))}
                </Select>

                <Select
                  id="filter-assignee"
                  name="assignee"
                  value={selectedAssignee}
                  onValueChange={(v) => setField("assignee", v)}
                  className="h-8 text-xs"
                >
                  <option value="">All assignees</option>
                  {reporterOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label}
                    </option>
                  ))}
                </Select>
              </>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-2">
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => clear()}
              >
                Clear
              </Button>
            )}
            <Button type="submit" size="sm" className="h-7 px-3 text-xs">
              Apply
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
