"use client";

import { Filter, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";

export function UsersToolbar({
  search,
  roleFilter,
  onSearchChange,
  onRoleChange,
  onClear,
}: {
  search: string;
  roleFilter: string;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onClear: () => void;
}) {
  const hasActiveFilters = !!roleFilter;

  return (
    <div className="border-b border-border/60 bg-muted/20 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            aria-label="Search users"
            type="text"
            placeholder="Search users (type at least 2 letters)"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-9 w-full rounded-lg pl-8 text-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <Popover>
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
                    1
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent
              className="filter-popup w-64 p-0 shadow-xl"
              align="end"
              sideOffset={8}>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm font-semibold">Filter Members</p>
                </div>
                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={onClear}>
                    Reset
                  </Button>
                )}
              </div>

              {/* Body */}
              <div className="space-y-3 p-4">
                <Select
                  aria-label="Filter users by role"
                  value={roleFilter}
                  onChange={(event) => onRoleChange(event.target.value)}
                  className="h-9 w-full rounded-lg text-xs">
                  <option value="">All roles</option>
                  <option value="USER">User</option>
                  <option value="TESTER">Tester</option>
                  <option value="ADMIN">Admin</option>
                </Select>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-border/60 px-4 py-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs"
                  onClick={onClear}>
                  Clear all
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {(search || hasActiveFilters) && (
            <Button type="button" variant="outline" size="sm" onClick={onClear}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            Role: {roleFilter.toLowerCase()}
          </span>
        </div>
      )}
    </div>
  );
}
