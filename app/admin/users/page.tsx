"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
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
import { UsersToolbar } from "./UsersToolbar";
import { UserRowActionsMenu } from "./UserRowActionsMenu";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(
    null,
  );
  const [roleNotice, setRoleNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [undoRoleChange, setUndoRoleChange] = useState<{
    userId: string;
    previousRole: string;
  } | null>(null);

  const pageSize = 15;

  function countChars(value: string) {
    return value.trim().length;
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = search.trim();
      if (!trimmed) {
        setDebouncedSearch("");
        setPage(1);
        return;
      }
      if (countChars(trimmed) >= 2) {
        setDebouncedSearch(trimmed);
        setPage(1);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  function roleBadgeVariant(role: string) {
    if (role === "ADMIN") return "warning" as const;
    if (role === "TESTER") return "secondary" as const;
    return "outline" as const;
  }

  async function loadUsers(
    nextPage = page,
    nextSearch = debouncedSearch,
    nextRole = roleFilter,
  ) {
    const params = new URLSearchParams({
      search: nextSearch,
      role: nextRole,
      page: String(nextPage),
      pageSize: String(pageSize),
    });

    const [res, allRes] = await Promise.all([
      fetch(`/api/admin/users?${params.toString()}`),
      fetch(`/api/admin/users?search=&role=&page=1&pageSize=1`),
    ]);
    const data = await res.json();
    const allData = await allRes.json();
    setUsers(data.users || []);
    setTotal(data.total || 0);
    setTotalRecords(allData.total || 0);
  }

  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, roleFilter, page]);

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
      void loadUsers();
    }
  }

  async function undoLastRoleUpdate() {
    if (!undoRoleChange) return;
    const target = users.find((user) => user.id === undoRoleChange.userId);
    if (!target) return;
    await updateSingleRole(undoRoleChange.userId, undoRoleChange.previousRole);
    setUndoRoleChange(null);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="page-stack">
      <PageHeader
        title="Users"
        description="Manage user accounts, access roles, and operational permissions."
      />
      <section className="space-y-3">
        <UsersToolbar
          search={search}
          roleFilter={roleFilter}
          onSearchChange={setSearch}
          onRoleChange={(value) => {
            setRoleFilter(value);
            setPage(1);
          }}
          onClear={() => {
            setSearch("");
            setRoleFilter("");
            setPage(1);
            setDebouncedSearch("");
            void loadUsers(1, "", "");
          }}
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
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/admin/users/${user.id}`);
                    }
                  }}>
                  <TableCell>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="font-medium text-primary hover:underline">
                      {user.name || "Unnamed user"}
                    </Link>
                    <p className="mt-1 text-[11px] text-muted-foreground lg:hidden">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                    <p className="mt-1 break-all text-[11px] text-muted-foreground sm:hidden">
                      {user.email}
                    </p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Link
                      href={`/admin/users/${user.id}`}
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
                    {new Date(user.createdAt).toLocaleString()}
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
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}>
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={page >= totalPages}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
