"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarRange, Check, Filter, Kanban, Rows3, StretchHorizontal } from "lucide-react";

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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedView, setSelectedView] = useState(view);
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [selectedPriority, setSelectedPriority] = useState(priority);
  const [selectedSeverity, setSelectedSeverity] = useState(severity);
  const [selectedReporter, setSelectedReporter] = useState(reporter);
  const [selectedAssignee, setSelectedAssignee] = useState(assignee);
  const [selectedCreatedFrom, setSelectedCreatedFrom] = useState(createdFrom);
  const [selectedCreatedTo, setSelectedCreatedTo] = useState(createdTo);

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

  useEffect(() => {
    setSelectedCreatedFrom(createdFrom);
  }, [createdFrom]);

  useEffect(() => {
    setSelectedCreatedTo(createdTo);
  }, [createdTo]);

  function cycleViewMode() {
    setSelectedView((current) => {
      if (current === "compact") return "details";
      if (current === "details") return "board";
      return "compact";
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

  function handleApply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextParams = new URLSearchParams();
    nextParams.set("view", selectedView);
    nextParams.set("page", "1");
    if (query) nextParams.set("q", query);
    if (selectedCreatedFrom) nextParams.set("createdFrom", selectedCreatedFrom);
    if (selectedCreatedTo) nextParams.set("createdTo", selectedCreatedTo);
    if (selectedStatus) nextParams.set("status", selectedStatus);
    if (selectedPriority) nextParams.set("priority", selectedPriority);
    if (selectedSeverity) nextParams.set("severity", selectedSeverity);
    if (selectedReporter) nextParams.set("reporter", selectedReporter);
    if (selectedAssignee) nextParams.set("assignee", selectedAssignee);
    setIsOpen(false);
    router.push(`${onSubmitHref}?${nextParams.toString()}`);
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative h-9 w-9 rounded-md border-border bg-background"
          aria-label="Open filters"
          title="Filters">
          <Filter className="h-4 w-4" aria-hidden="true" />
          {hasActiveFilters && (
            <Badge variant="secondary" className="absolute -right-1.5 -top-1 min-w-4 px-1 py-0 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent id="issues-filter-popover" className="w-[min(92vw,340px)] p-3" align="end">
        <form className="space-y-3" onSubmit={handleApply}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-muted-foreground">Filters</p>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={cycleViewMode}
              aria-label={`View mode: ${viewModeLabel}. Click to switch mode.`}
              title={`View mode: ${viewModeLabel}`}
              className="h-8 w-8 rounded-md">
              <ViewModeIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          {hasActiveFilters ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Active filters
            </span>
          ) : null}

          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="issues-created-from" className="text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" />
                  Created from
                </span>
              </Label>
              <Input
                id="issues-created-from"
                type="date"
                value={selectedCreatedFrom}
                onChange={(event) => setSelectedCreatedFrom(event.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="issues-created-to" className="text-xs text-muted-foreground">
                Created to
              </Label>
              <Input
                id="issues-created-to"
                type="date"
                value={selectedCreatedTo}
                onChange={(event) => setSelectedCreatedTo(event.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {isAdmin ? (
              <>
                <Select
                  id="issues-status-filter"
                  name="status"
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                  className="h-9 rounded-md text-xs">
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
                  onValueChange={setSelectedPriority}
                  className="h-9 rounded-md text-xs">
                  <option value="">All priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </Select>

                <Select
                  id="issues-severity-filter"
                  name="severity"
                  value={selectedSeverity}
                  onValueChange={setSelectedSeverity}
                  className="h-9 rounded-md text-xs">
                  <option value="">All severities</option>
                  <option value="MINOR">Minor</option>
                  <option value="MAJOR">Major</option>
                  <option value="CRITICAL">Critical</option>
                </Select>

                <Select
                  id="issues-reporter-filter"
                  name="reporter"
                  value={selectedReporter}
                  onValueChange={setSelectedReporter}
                  className="h-9 rounded-md text-xs">
                  <option value="">All reporters</option>
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
                  onValueChange={setSelectedAssignee}
                  className="h-9 rounded-md text-xs">
                  <option value="">All assignees</option>
                  {reporterOptions.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.label}
                    </option>
                  ))}
                </Select>
              </>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-2">
            {hasActiveFilters ? (
              <Button
                variant="outline"
                size="dense"
                className="rounded-md"
                onClick={() => {
                  setIsOpen(false);
                  router.push(onResetHref);
                }}
              >
                Clear
              </Button>
            ) : null}
            <Button type="submit" size="dense" className="rounded-md">
              Apply
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
