"use client";

import { useRef } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

type DashboardFiltersProps = {
  searchInput: string;
  setSearchInput: (v: string) => void;
  setSearchQuery: (v: string) => void;
  timeRange: string;
  setTimeRange: (v: string) => void;
  filtersOpen: boolean;
  setIsOpen: (v: boolean) => void;
  openFiltersPanel: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  hasDraftFilters: boolean;
  hasPendingFilterChanges: boolean;
  drafts: { status?: string; priority?: string; severity?: string };
  setField: (key: string, value: string) => void;
  clear: () => void;
  applyDraftFilters: () => void;
};

export function DashboardFilters({
  searchInput,
  setSearchInput,
  setSearchQuery,
  timeRange,
  setTimeRange,
  filtersOpen,
  setIsOpen,
  openFiltersPanel,
  hasActiveFilters,
  activeFilterCount,
  hasDraftFilters,
  hasPendingFilterChanges,
  drafts,
  setField,
  clear,
  applyDraftFilters,
}: DashboardFiltersProps) {
  const filtersPanelRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="rounded-xl bg-muted/20 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-[290px]">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search dashboard (type at least 2 letters)"
            aria-label="Search dashboard issues"
            className="h-8 rounded-md pl-8 pr-8 text-xs"
          />
          {searchInput ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setSearchInput("");
                setSearchQuery("");
              }}
              aria-label="Clear search"
              className="absolute right-0.5 top-1/2 h-6 w-6 -translate-y-1/2 rounded-md">
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <div ref={filtersPanelRef} className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="relative h-8 w-8 rounded-md p-0"
              aria-label="Toggle dashboard filters"
              aria-expanded={filtersOpen}
              aria-controls="dashboard-filters-popover"
              onClick={() => {
                if (filtersOpen) {
                  setIsOpen(false);
                  return;
                }
                openFiltersPanel();
              }}>
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              {hasActiveFilters ? (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>

            {filtersOpen ? (
              <Card
                id="dashboard-filters-popover"
                className="popover-surface absolute right-0 top-9 z-30 w-[min(88vw,220px)] bg-card shadow-lg">
                <CardContent className="space-y-1.5 p-2">
                  <Select
                    value={drafts.status ?? ""}
                    onValueChange={(v) => setField("status", v)}
                    className="h-8 text-xs">
                    <option value="">All Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </Select>
                  <Select
                    value={drafts.priority ?? ""}
                    onValueChange={(v) => setField("priority", v)}
                    className="h-8 text-xs">
                    <option value="">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </Select>
                  <Select
                    value={drafts.severity ?? ""}
                    onValueChange={(v) => setField("severity", v)}
                    className="h-8 text-xs">
                    <option value="">All Severities</option>
                    <option value="MINOR">Minor</option>
                    <option value="MAJOR">Major</option>
                    <option value="CRITICAL">Critical</option>
                  </Select>
                  <div className="flex items-center justify-end gap-1.5 pt-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={!hasDraftFilters}
                      onClick={clear}>
                      Clear
                    </Button>
                    <Button
                      type="button"
                      size="dense"
                      className="h-7 px-2 text-xs"
                      disabled={!hasPendingFilterChanges}
                      onClick={applyDraftFilters}>
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <Select
            value={timeRange}
            onValueChange={setTimeRange}
            className="h-8 w-[124px] text-xs">
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
            <option value="365d">1 year</option>
          </Select>
        </div>
      </div>
    </div>
  );
}
