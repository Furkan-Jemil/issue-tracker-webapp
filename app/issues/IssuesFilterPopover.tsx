"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Filter, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  query,
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
  query: string;
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

  return (
    <div ref={containerRef} className="relative">
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        size="icon"
        className="relative h-9 w-9 rounded-full border-border/80 bg-background/85"
        aria-label="Open filters"
        title="Filters"
        aria-expanded={open}
        aria-controls="issues-filter-popover"
        onClick={() => setOpen((current) => !current)}>
        <Filter className="h-4 w-4" aria-hidden="true" />
        {hasActiveFilters && (
          <Badge variant="secondary" className="absolute -right-1 -top-1 min-w-4 px-1 py-0 text-[10px]">
            •
          </Badge>
        )}
      </Button>

      {open && (
        <div
          id="issues-filter-popover"
          className="absolute left-0 top-11 z-30 w-[min(92vw,360px)] rounded-2xl border border-border/75 bg-card/95 p-3.5 shadow-[0_18px_36px_rgba(15,23,42,0.16)] backdrop-blur-xl md:left-auto md:right-0">
          <form
            method="get"
            action={onSubmitHref}
            className="space-y-3"
            onSubmit={() => setOpen(false)}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Filters
              </p>
              {hasActiveFilters ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  <Check className="h-3 w-3" aria-hidden="true" />
                  Active
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <Button type="button" variant={selectedView === "compact" ? "default" : "outline"} size="dense" onClick={() => setSelectedView("compact")} className="justify-center rounded-full">
                Compact
              </Button>
              <Button type="button" variant={selectedView === "details" ? "default" : "outline"} size="dense" onClick={() => setSelectedView("details")} className="justify-center rounded-full">
                Detailed
              </Button>
              <Button type="button" variant={selectedView === "board" ? "default" : "outline"} size="dense" onClick={() => setSelectedView("board")} className="justify-center rounded-full">
                Board
              </Button>
            </div>
            <input type="hidden" name="view" value={selectedView} />

            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <label htmlFor="issues-title-search" className="sr-only">
                  Search issue title
                </label>
                <Input
                  id="issues-title-search"
                  name="q"
                  defaultValue={query}
                  placeholder="Search title"
                  className="h-9 rounded-xl pl-9"
                />
              </div>
              {isAdmin && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Select
                    id="issues-status-filter"
                    name="status"
                    defaultValue={status}
                    className="h-9 rounded-xl">
                    <option value="">All Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </Select>
                  <Select
                    id="issues-priority-filter"
                    name="priority"
                    defaultValue={priority}
                    className="h-9 rounded-xl">
                    <option value="">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </Select>
                  <Select
                    id="issues-severity-filter"
                    name="severity"
                    defaultValue={severity}
                    className="h-9 rounded-xl">
                    <option value="">All Severities</option>
                    <option value="MINOR">Minor</option>
                    <option value="MAJOR">Major</option>
                    <option value="CRITICAL">Critical</option>
                  </Select>
                  <Select
                    id="issues-reporter-filter"
                    name="reporter"
                    defaultValue={reporter}
                    className="h-9 rounded-xl">
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
                    defaultValue={assignee}
                    className="h-9 rounded-xl sm:col-span-2">
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

            <div className="flex items-center justify-end gap-2 pt-1">
              {hasActiveFilters && (
                <Button asChild variant="outline" size="dense" onClick={() => setOpen(false)} className="rounded-full">
                  <Link href={onResetHref}>Reset</Link>
                </Button>
              )}
              <Button type="submit" size="dense" className="rounded-full px-3">
                {isAdmin ? "Apply" : "Search"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
