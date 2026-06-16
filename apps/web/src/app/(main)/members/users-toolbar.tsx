"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  return (
    <div className="border-b border-border/60 bg-muted/20 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <Input
          aria-label="Search users"
          type="text"
          placeholder="Search users (type at least 2 letters)"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full max-w-sm"
        />
        <div className="flex items-center gap-2 sm:ml-auto">
          <Select
            aria-label="Filter users by role"
            value={roleFilter}
            onChange={(event) => onRoleChange(event.target.value)}
            className="w-28 md:w-36">
            <option value="">All roles</option>
            <option value="USER">User</option>
            <option value="TESTER">Tester</option>
            <option value="ADMIN">Admin</option>
          </Select>
          <Button type="button" variant="outline" size="sm" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}