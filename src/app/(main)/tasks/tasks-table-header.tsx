"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/layout/search-input";
import { IssuesFilterPopover } from "@/app/(main)/tasks/tasks-table-filter";

type ReporterOption = {
  id: string;
  label: string;
  role: string;
};

export function IssuesToolbar({
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
  return (
    <div className="grid gap-2 border-b border-border/60 bg-muted/20 py-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <SearchInput
        placeholder="Search issues (type at least 2 letters)"
        className="w-full max-w-sm"
      />
      <div className="flex items-center gap-1.5 md:justify-self-end">
        <IssuesFilterPopover
          view={view}
          isAdmin={isAdmin}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          query={query}
          createdFrom={createdFrom}
          createdTo={createdTo}
          status={status}
          priority={priority}
          severity={severity}
          reporter={reporter}
          assignee={assignee}
          reporters={reporters}
          onSubmitHref={onSubmitHref}
          onResetHref={onResetHref}
        />
        <Button asChild size="sm">
          <Link href="/tasks/new">Create Issue</Link>
        </Button>
      </div>
    </div>
  );
}