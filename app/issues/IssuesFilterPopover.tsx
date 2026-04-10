"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Filter, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  view: "compact" | "details";
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

  return (
    <div ref={containerRef} className="relative">
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        aria-expanded={open}
        aria-controls="issues-filter-popover"
        onClick={() => setOpen((current) => !current)}>
        <Filter className="h-4 w-4" aria-hidden="true" />
        Filter
        {hasActiveFilters && (
          <Badge variant="secondary" className="ml-1">
            Active
          </Badge>
        )}
      </Button>

      {open && (
        <div
          id="issues-filter-popover"
          className="absolute left-0 top-11 z-30 w-[min(92vw,860px)] rounded-xl border border-border/70 bg-card p-3 shadow-lg md:left-auto md:right-0">
          <form method="get" action={onSubmitHref} className="space-y-3">
            <input type="hidden" name="view" value={view} />
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              <div className="relative md:col-span-2 lg:col-span-3">
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
                  className="pl-9"
                />
              </div>
              {isAdmin && (
                <>
                  <select
                    id="issues-status-filter"
                    name="status"
                    defaultValue={status}
                    className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option value="">All Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  <select
                    id="issues-priority-filter"
                    name="priority"
                    defaultValue={priority}
                    className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option value="">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                  <select
                    id="issues-severity-filter"
                    name="severity"
                    defaultValue={severity}
                    className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option value="">All Severities</option>
                    <option value="MINOR">Minor</option>
                    <option value="MAJOR">Major</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                  <select
                    id="issues-reporter-filter"
                    name="reporter"
                    defaultValue={reporter}
                    className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option value="">All Reporters</option>
                    {reporterOptions.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.label}
                      </option>
                    ))}
                  </select>
                  <select
                    id="issues-assignee-filter"
                    name="assignee"
                    defaultValue={assignee}
                    className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option value="">All Assignees</option>
                    {reporterOptions.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.label}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm">
                {isAdmin ? "Apply" : "Search"}
              </Button>
              {hasActiveFilters && (
                <Button asChild variant="outline" size="sm" onClick={() => setOpen(false)}>
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
