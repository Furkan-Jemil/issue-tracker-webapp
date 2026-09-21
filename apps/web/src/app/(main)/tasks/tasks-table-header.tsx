"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  const onTasksPage = pathname === "/tasks" || pathname.startsWith("/tasks?");

  function handleCreateClick() {
    if (onTasksPage && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("issue-tracker:open-create-drawer"));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search — grows to fill available space */}
      <div className="flex-1 min-w-[160px] max-w-sm">
        <SearchInput
          placeholder="Filter by title, ID, or keyword…"
          className="w-full"
        />
      </div>

      {/* Right-side controls — baseline-aligned */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Filter popover */}
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

        {/* Create issue */}
        {onTasksPage ? (
          <Button
            type="button"
            size="sm"
            variant="default"
            className="gap-1.5"
            onClick={handleCreateClick}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Create issue
          </Button>
        ) : (
          <Button asChild size="sm" variant="default" className="gap-1.5">
            <Link href="/tasks/new">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Create issue
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
