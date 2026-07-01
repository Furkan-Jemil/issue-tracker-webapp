"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAutoSearch } from "@/lib/useAutoSearch";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UsersToolbar } from "./users-toolbar";
import { UserRowActionsMenu } from "./user-row-actions-menu";
import { formatDate } from "@/lib/utils";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
};

function getRoleStyle(role: string) {
  if (role === "ADMIN")
    return "border-amber-300/60 bg-amber-100/70 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300 dark:border-amber-400/40";
  if (role === "TESTER")
    return "border-[hsl(var(--color-in-progress)/0.4)] bg-[hsl(var(--color-in-progress)/0.1)] text-[hsl(var(--color-resolved))] dark:bg-[hsl(var(--color-in-progress)/0.18)] dark:text-[hsl(var(--color-in-progress))]";
  return "border-border/60 bg-muted/60 text-muted-foreground";
}

function getInitials(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Pick a deterministic avatar background from the blue palette */
const AVATAR_COLORS = [
  "bg-[hsl(var(--color-open))]",
  "bg-[hsl(var(--color-in-progress))]",
  "bg-[hsl(var(--color-resolved))]",
  "bg-[hsl(var(--color-closed))]",
];
function avatarColor(id: string) {
  const idx = id.charCodeAt(id.length - 1) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export function MembersClient({
  initialUsers,
  total,
  totalRecords,
  page,
  totalPages,
  search,
  roleFilter,
}: {
  initialUsers: UserRow[];
  total: number;
  totalRecords: number;
  page: number;
  totalPages: number;
  search: string;
  roleFilter: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);
  const [roleNotice, setRoleNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [undoRoleChange, setUndoRoleChange] = useState<{
    userId: string;
    previousRole: string;
  } | null>(null);
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => { setUsers(initialUsers); }, [initialUsers]);

  // Auto-search: fires after 2+ chars, 300ms debounce
  const handleSearch = useCallback((trimmed: string) => {
    const currentUrl = new URL(window.location.href);
    if (trimmed === search) return;
    if (!trimmed) {
      currentUrl.searchParams.delete("search");
    } else {
      currentUrl.searchParams.set("search", trimmed);
    }
    currentUrl.searchParams.set("page", "1");
    router.push(currentUrl.pathname + currentUrl.search);
  }, [search, router]);
  useAutoSearch(localSearch, handleSearch, 2, 300);

  useEffect(() => {
    if (!roleNotice) return;
    const timer = window.setTimeout(() => setRoleNotice(null), 5200);
    return () => window.clearTimeout(timer);
  }, [roleNotice]);

  async function updateSingleRole(userId: string, role: string) {
    const previousRole = users.find((u) => u.id === userId)?.role;
    if (!previousRole || previousRole === role) return;
    setUpdatingRoleUserId(userId);
    setUsers((cur) => cur.map((u) => (u.id === userId ? { ...u, role } : u)));
    try {
      const res = await fetch("/api/admin/users/bulk-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [userId], role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to update role");
      }
      setRoleNotice({
        type: "success",
        text: `Role updated for ${users.find((u) => u.id === userId)?.email || "user"}.`,
      });
      setUndoRoleChange({ userId, previousRole });
      router.refresh();
    } catch (error) {
      setUsers((cur) => cur.map((u) => (u.id === userId ? { ...u, role: previousRole } : u)));
      setRoleNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update role",
      });
      setUndoRoleChange(null);
    } finally {
      setUpdatingRoleUserId(null);
    }
  }

  async function undoLastRoleUpdate() {
    if (!undoRoleChange) return;
    await updateSingleRole(undoRoleChange.userId, undoRoleChange.previousRole);
    setUndoRoleChange(null);
  }

  function handleRoleChange(value: string) {
    const currentUrl = new URL(window.location.href);
    if (value) currentUrl.searchParams.set("role", value);
    else currentUrl.searchParams.delete("role");
    currentUrl.searchParams.set("page", "1");
    router.push(currentUrl.pathname + currentUrl.search);
  }

  function handlePageChange(newPage: number) {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("page", String(newPage));
    router.push(currentUrl.pathname + currentUrl.search);
  }

  function handleClear() {
    setLocalSearch("");
    router.push("/members");
  }

  return (
    <div className="space-y-4">
      <UsersToolbar
        search={localSearch}
        roleFilter={roleFilter}
        onSearchChange={setLocalSearch}
        onRoleChange={handleRoleChange}
        onClear={handleClear}
      />

      {/* Toast notice */}
      {roleNotice && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            roleNotice.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
          }`}
          role="status"
          aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{roleNotice.text}</span>
            {roleNotice.type === "success" && undoRoleChange ? (
              <Button type="button" size="dense" variant="soft" onClick={undoLastRoleUpdate}>
                Undo
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {/* Summary line */}
      <p className="text-[12px] text-muted-foreground tabular-nums">
        Showing {total} of {totalRecords} members
        {roleFilter ? ` · Filtered by ${roleFilter.toLowerCase()}` : ""}
      </p>

      {/* Profile card grid */}
      {users.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {users.map((user, index) => (
            <Card
              key={user.id}
              className="group relative cursor-pointer overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-ring/50 animate-in fade-in-0 slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => router.push(`/members/${user.id}`)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/members/${user.id}`);
                }
              }}
              role="button"
              aria-label={`View profile of ${user.name || user.email}`}>
              {/* Color strip top */}
              <div className={`h-1.5 w-full ${avatarColor(user.id)}`} aria-hidden="true" />

              <CardContent className="flex flex-col items-center gap-2 px-4 py-4 text-center">
                {/* Avatar */}
                <div className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white shadow-sm ${avatarColor(user.id)}`}>
                  {getInitials(user.name, user.email)}
                </div>

                {/* Name & email */}
                <div className="min-w-0 w-full">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {user.name || "Unnamed"}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                </div>

                {/* Role badge */}
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getRoleStyle(user.role)}`}>
                  {user.role}
                </span>

                {/* Joined date */}
                <p className="text-[10px] text-muted-foreground/70">
                  Joined {formatDate(user.createdAt)}
                </p>

                {/* Role change — stops card click propagation */}
                <div
                  className="mt-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                  onClick={(e) => e.stopPropagation()}>
                  <UserRowActionsMenu
                    userId={user.id}
                    currentRole={user.role as "USER" | "TESTER" | "ADMIN"}
                    disabled={updatingRoleUserId === user.id}
                    onChangeRole={(role) => { void updateSingleRole(user.id, role); }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">No members found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filter.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page <= 1}>
              ← Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}>
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
