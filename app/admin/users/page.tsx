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
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);
  const [roleNotice, setRoleNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const pageSize = 20;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  async function loadUsers(nextPage = page, nextSearch = debouncedSearch, nextRole = roleFilter) {
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
    const timer = window.setTimeout(() => setRoleNotice(null), 2200);
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
    } finally {
      setUpdatingRoleUserId(null);
      void loadUsers();
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const adminCount = users.filter((user) => user.role === "ADMIN").length;
  const testerCount = users.filter((user) => user.role === "TESTER").length;

  return (
    <div className="page-stack">
      <PageHeader title="Users" description="Manage user accounts, roles, and permissions." icon={UsersRound} />

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => {
            setRoleFilter("");
            setPage(1);
          }}
          className="text-left"
        >
          <Card className="group cursor-pointer border-border/70 bg-card/95 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-ring/50">
            <CardContent className="flex items-center justify-between gap-3 p-3.5">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Visible users</p>
                <p className="mt-1 text-2xl font-semibold">{users.length}</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 group-hover:text-foreground">Show all</p>
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
          className="text-left"
        >
          <Card className="group cursor-pointer border-border/70 bg-card/95 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-ring/50">
            <CardContent className="flex items-center justify-between gap-3 p-3.5">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Admins on page</p>
                <p className="mt-1 text-2xl font-semibold">{adminCount}</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 group-hover:text-foreground">Filter admins</p>
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
          className="text-left"
        >
          <Card className="group cursor-pointer border-border/70 bg-card/95 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-ring/50">
            <CardContent className="flex items-center justify-between gap-3 p-3.5">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Testers on page</p>
                <p className="mt-1 text-2xl font-semibold">{testerCount}</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 group-hover:text-foreground">Filter testers</p>
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
          <CardTitle className="flex items-center justify-between text-lg">
            <span>User Management</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Select row
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2.5">
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
              className="min-w-64 flex-1"
            />
            <Select
              aria-label="Filter users by role"
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setPage(1);
              }}
              className="max-w-44"
            >
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
              }}
            >
              Clear
            </Button>
          </div>

          {roleNotice && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                roleNotice.type === "success"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-red-500/40 bg-red-500/10 text-red-300"
              }`}
              role="status"
              aria-live="polite"
            >
              {roleNotice.text}
            </div>
          )}

          <Table className="rounded-xl border border-border/70 bg-card/40">
            <caption className="sr-only">Admin users table</caption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Name</TableHead>
                <TableHead scope="col">Email</TableHead>
                <TableHead scope="col">Role</TableHead>
                <TableHead scope="col">Created</TableHead>
                <TableHead scope="col">Actions</TableHead>
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
                  }}
                >
                  <TableCell>
                    <Link href={`/admin/users/${user.id}`} className="font-medium text-primary hover:underline">
                      {user.name || "Unnamed user"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/users/${user.id}`} className="text-muted-foreground hover:text-primary hover:underline">
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
                      onChange={(event) => {
                        event.stopPropagation();
                        void updateSingleRole(user.id, event.target.value);
                      }}
                      className="h-8 w-32 rounded-full border-border/70 bg-background/80 px-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
                    >
                      <option value="USER">User</option>
                      <option value="TESTER">Tester</option>
                      <option value="ADMIN">Admin</option>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-primary hover:underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No users found for this search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
