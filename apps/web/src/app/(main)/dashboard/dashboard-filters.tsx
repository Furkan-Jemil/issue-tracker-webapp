"use client";

import { useRef } from "react";
import { CalendarRange, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

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
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
      {/* Search */}
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          ref={searchRef}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search (2+ letters)…"
          aria-label="Search dashboard issues"
          className="h-8 rounded-lg border-transparent bg-transparent pl-8 pr-7 text-xs shadow-none focus:border-border focus:bg-background"
        />
        {searchInput && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => { setSearchInput(""); setSearchQuery(""); }}
            aria-label="Clear search"
            className="absolute right-0.5 top-1/2 h-6 w-6 -translate-y-1/2 rounded-md text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" aria-hidden="true" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {/* Filter Popover */}
        <Popover open={filtersOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="relative h-8 gap-1.5 rounded-lg px-2.5 text-xs"
              aria-label="Toggle filters">
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
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
            className="filter-popup w-72 p-0 shadow-xl"
            align="end"
            sideOffset={8}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <p className="text-sm font-semibold">Dashboard Filters</p>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={clear}>
                  Reset all
                </Button>
              )}
            </div>

            {/* Body */}
            <div className="space-y-3 p-4">
              <Select
                value={drafts.status ?? ""}
                onValueChange={(v) => setField("status", v)}
                className="h-9 rounded-lg text-xs">
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </Select>

              <Select
                value={drafts.priority ?? ""}
                onValueChange={(v) => setField("priority", v)}
                className="h-9 rounded-lg text-xs">
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </Select>

              <Select
                value={drafts.severity ?? ""}
                onValueChange={(v) => setField("severity", v)}
                className="h-9 rounded-lg text-xs">
                <option value="">All Severities</option>
                <option value="MINOR">Minor</option>
                <option value="MAJOR">Major</option>
                <option value="CRITICAL">Critical</option>
              </Select>

              {/* Time range inside popover */}
              <div className="space-y-1">
                <Label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" />
                  Time range
                </Label>
                <Select
                  value={timeRange}
                  onValueChange={setTimeRange}
                  className="h-9 rounded-lg text-xs">
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="365d">Last year</option>
                </Select>
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
                disabled={!hasPendingFilterChanges}
                onClick={applyDraftFilters}>
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
