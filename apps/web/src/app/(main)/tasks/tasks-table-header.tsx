"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/layout/search-input";
import { IssuesFilterPopover } from "@/app/(main)/tasks/tasks-table-filter";

type ReporterOption = {
  id: string;
  label: string;
  role: string;
};

// Note: view prop kept for backwards compat but no longer used for toggling
export function IssuesToolbar({
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
  view?: "compact" | "details" | "board";
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
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        placeholder="Search issues…"
        className="h-9 w-full max-w-[220px]"
      />
      <div className="flex items-center gap-1.5">
        <IssuesFilterPopover
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
        <Button asChild size="sm" className="h-9 gap-1.5 rounded-lg px-3 text-xs font-semibold">
          <Link href="/tasks/new">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Create Issue</span>
            <span className="sm:hidden">New</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}