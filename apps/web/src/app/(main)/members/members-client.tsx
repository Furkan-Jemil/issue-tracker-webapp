"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  // Sync props to state when server re-renders with new data
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  // Debounced search pushing to URL
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = localSearch.trim();
      const currentUrl = new URL(window.location.href);
      if (trimmed === search) return; // No change
      if (!trimmed) {
        currentUrl.searchParams.delete("search");
      } else if (trimmed.length >= 2) {
        currentUrl.searchParams.set("search", trimmed);
      } else {
        return; // don't search for 1 character
      }
      currentUrl.searchParams.set("page", "1");
      router.push(currentUrl.pathname + currentUrl.search);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [localSearch, router, search]);

  function roleBadgeVariant(role: string) {
    if (role === "ADMIN") return "warning" as const;
    if (role === "TESTER") return "secondary" as const;
    return "outline" as const;
  }

  useEffect(() => {
    if (!roleNotice) return;
    const timer = window.setTimeout(() => setRoleNotice(null), 5200);
    return () => window.clearTimeout(timer);
  }, [roleNotice]);

  async function updateSingleRole(userId: string, role: string) {
    const previousRole = users.find((user) => user.id === userId)?.role;
    if (!previousRole || previousRole === role) return;

    setUpdatingRoleUserId(userId);
    setUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, role } : user)),
    );

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
        text: `Role updated for ${users.find((user) => user.id === userId)?.email || "user"}.`,
      });
      setUndoRoleChange({ userId, previousRole });
      router.refresh();
    } catch (error) {
      setUsers((current) =>
        current.map((user) =>
          user.id === userId ? { ...user, role: previousRole } : user,
        ),
      );
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
    const target = users.find((user) => user.id === undoRoleChange.userId);
    if (!target) return;
    await updateSingleRole(undoRoleChange.userId, undoRoleChange.previousRole);
    setUndoRoleChange(null);
  }

  function handleRoleChange(value: string) {
    const currentUrl = new URL(window.location.href);
    if (value) {
      currentUrl.searchParams.set("role", value);
    } else {
      currentUrl.searchParams.delete("role");
    }
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
    <div className="space-y-3">
      <UsersToolbar
        search={localSearch}
        roleFilter={roleFilter}
        onSearchChange={setLocalSearch}
        onRoleChange={handleRoleChange}
        onClear={handleClear}
      />
      <div className="space-y-3">
        {roleNotice && (
          <div
            className={`rounded-lg border px-3 py-2 text-sm ${
              roleNotice.type === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/40 bg-red-500/10 text-red-300"
            }`}
            role="status"
            aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>{roleNotice.text}</span>
              {roleNotice.type === "success" && undoRoleChange ? (
                <Button
                  type="button"
                  size="dense"
                  variant="soft"
                  onClick={undoLastRoleUpdate}>
                  Undo
                </Button>
              ) : null}
            </div>
          </div>
        )}

        <Table className="bg-transparent">
          <caption className="sr-only">Admin users table</caption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Name</TableHead>
              <TableHead scope="col" className="hidden sm:table-cell">Email</TableHead>
              <TableHead scope="col">Role</TableHead>
              <TableHead scope="col" className="hidden lg:table-cell">
                Created
              </TableHead>
              <TableHead scope="col" className="hidden md:table-cell text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="cursor-pointer transition hover:bg-muted/30"
                tabIndex={0}
                onClick={() => router.push(`/members/${user.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/members/${user.id}`);
                  }
                }}>
                <TableCell>
                  <Link
                    href={`/members/${user.id}`}
                    className="font-medium text-primary hover:underline">
                    {user.name || "Unnamed user"}
                  </Link>
                  <p className="mt-1 text-[11px] text-muted-foreground lg:hidden">
                    Joined {formatDate(user.createdAt)}
                  </p>
                  <p className="mt-1 break-all text-[11px] text-muted-foreground sm:hidden">
                    {user.email}
                  </p>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Link
                    href={`/members/${user.id}`}
                    className="break-all text-muted-foreground hover:text-primary hover:underline">
                    {user.email}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={roleBadgeVariant(user.role)} className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]">
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-right">
                  <div className="flex justify-end">
                    <UserRowActionsMenu
                      userId={user.id}
                      currentRole={user.role as "USER" | "TESTER" | "ADMIN"}
                      disabled={updatingRoleUserId === user.id}
                      onChangeRole={(role) => {
                        void updateSingleRole(user.id, role);
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-sm text-muted-foreground">
                  No users found for this search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <tfoot>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableCell colSpan={5} className="py-1.5 text-xs text-muted-foreground">
                <div className="flex items-center justify-between px-[var(--table-cell-px)]">
                  <span className="text-[11px]">Total {totalRecords} | Filtered {total}</span>
                  <span>Page {page} / {totalPages}</span>
                </div>
              </TableCell>
            </TableRow>
          </tfoot>
        </Table>

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page <= 1}>
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
