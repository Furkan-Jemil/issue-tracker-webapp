"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UsersRound, UserCog, UserCheck, ArrowUpRight } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
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

  const pageSize = 20;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

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

    const res = await fetch(`/api/admin/users?${params.toString()}`);
    const data = await res.json();
    setUsers(data.users || []);
    setTotal(data.total || 0);
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
  const adminCount = users.filter((user) => user.role === "ADMIN").length;
  const testerCount = users.filter((user) => user.role === "TESTER").length;

  return (
    <div className="page-stack">
      <PageHeader
        title="Users"
        description="Manage user accounts, access roles, and operational permissions."
        icon={UsersRound}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => {
            setRoleFilter("");
            setPage(1);
          }}
          className="text-left">
          <Card className="group cursor-pointer border-border/70 bg-card/95 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg focus-within:ring-2 focus-within:ring-ring/50">
            <CardContent className="flex items-center justify-between gap-3 p-3.5">
              <div>
                <p className="text-[12px] font-medium text-muted-foreground">
                  Visible users
                </p>
                <p className="mt-1 text-2xl font-semibold">{users.length}</p>
                <p className="text-[11px] text-muted-foreground/80 group-hover:text-foreground">
                  Show all
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground">
                <UsersRound className="h-5 w-5" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => {
            setRoleFilter("ADMIN");
            setPage(1);
          }}
          className="text-left">
          <Card className="group cursor-pointer border-border/70 bg-card/95 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg focus-within:ring-2 focus-within:ring-ring/50">
            <CardContent className="flex items-center justify-between gap-3 p-3.5">
              <div>
                <p className="text-[12px] font-medium text-muted-foreground">
                  Admins on page
                </p>
                <p className="mt-1 text-2xl font-semibold">{adminCount}</p>
                <p className="text-[11px] text-muted-foreground/80 group-hover:text-foreground">
                  Filter admins
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground">
                <UserCog className="h-5 w-5" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => {
            setRoleFilter("TESTER");
            setPage(1);
          }}
          className="text-left">
          <Card className="group cursor-pointer border-border/70 bg-card/95 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg focus-within:ring-2 focus-within:ring-ring/50">
            <CardContent className="flex items-center justify-between gap-3 p-3.5">
              <div>
                <p className="text-[12px] font-medium text-muted-foreground">
                  Testers on page
                </p>
                <p className="mt-1 text-2xl font-semibold">{testerCount}</p>
                <p className="text-[11px] text-muted-foreground/80 group-hover:text-foreground">
                  Filter testers
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground">
                <UserCheck className="h-5 w-5" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <CardTitle className="text-lg">User Management</CardTitle>
            <div className="hidden items-center gap-2 sm:flex">
              <Input
                aria-label="Search users"
                type="text"
                placeholder="Search name or email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    const nextSearch = search.trim();
                    setDebouncedSearch(nextSearch);
                    setPage(1);
                    void loadUsers(1, nextSearch, roleFilter);
                  }
                }}
                className="w-52 lg:w-64"
              />
              <Select
                aria-label="Filter users by role"
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value);
                  setPage(1);
                }}
                className="w-36">
                <option value="">All roles</option>
                <option value="USER">User</option>
                <option value="TESTER">Tester</option>
                <option value="ADMIN">Admin</option>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("");
                  setPage(1);
                  setDebouncedSearch("");
                  void loadUsers(1, "", "");
                }}>
                Clear
              </Button>
            </div>
            <span className="hidden items-center gap-1 text-xs font-medium text-muted-foreground lg:inline-flex">
              Select row
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-end sm:hidden">
            <Button
              type="button"
              variant="soft"
              size="sm"
              onClick={() => setMobileFiltersOpen((current) => !current)}>
              {mobileFiltersOpen ? "Hide filters" : "Show filters"}
            </Button>
          </div>

          {mobileFiltersOpen && (
            <div className="grid gap-2.5 rounded-xl border border-border/70 bg-background/70 p-3 sm:hidden">
              <Input
                aria-label="Search users"
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    const nextSearch = search.trim();
                    setDebouncedSearch(nextSearch);
                    setPage(1);
                    void loadUsers(1, nextSearch, roleFilter);
                  }
                }}
                className="w-full"
              />
              <Select
                aria-label="Filter users by role"
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value);
                  setPage(1);
                }}>
                <option value="">All roles</option>
                <option value="USER">User</option>
                <option value="TESTER">Tester</option>
                <option value="ADMIN">Admin</option>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("");
                  setPage(1);
                  setDebouncedSearch("");
                  void loadUsers(1, "", "");
                }}>
                Clear
              </Button>
            </div>
          )}

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

          <Table className="rounded-xl border border-border/70 bg-card/40">
            <caption className="sr-only">Admin users table</caption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Name</TableHead>
                <TableHead scope="col">Email</TableHead>
                <TableHead scope="col">Role</TableHead>
                <TableHead scope="col" className="hidden lg:table-cell">
                  Created
                </TableHead>
                <TableHead scope="col" className="hidden md:table-cell">
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
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-muted-foreground hover:text-primary hover:underline">
                      {user.email}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Select
                      aria-label={`Change role for ${user.email}`}
                      value={user.role}
                      disabled={updatingRoleUserId === user.id}
                      onPointerDown={(event) => event.stopPropagation()}
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={(event) => event.stopPropagation()}
                      onValueChange={(value) => {
                        void updateSingleRole(user.id, value);
                      }}
                      className="h-8 w-32 rounded-full border-border/70 bg-background/80 px-3 text-[11px] font-semibold">
                      <option value="USER">User</option>
                      <option value="TESTER">Tester</option>
                      <option value="ADMIN">Admin</option>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {new Date(user.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-primary hover:underline"
                      onClick={(event) => event.stopPropagation()}>
                      Edit
                    </Link>
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
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              Page {page} / {totalPages}
            </span>
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
        </CardContent>
      </Card>
    </div>
  );
}
