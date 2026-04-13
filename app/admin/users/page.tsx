"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
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
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState("");

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

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }

  async function handleBulkRole() {
    if (!bulkRole || selected.length === 0) return;
    await fetch("/api/admin/users/bulk-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected, role: bulkRole }),
    });
    setSelected([]);
    setBulkRole("");
    void loadUsers();
  }

  async function updateSingleRole(userId: string, role: string) {
    await fetch("/api/admin/users/bulk-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [userId], role }),
    });
    void loadUsers();
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const adminCount = users.filter((user) => user.role === "ADMIN").length;
  const testerCount = users.filter((user) => user.role === "TESTER").length;

  return (
    <div className="page-stack">
      <PageHeader title="Users" description="Manage user accounts, roles, and permissions." />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-3.5">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Visible users</p>
            <p className="mt-1 text-2xl font-semibold">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3.5">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Admins on page</p>
            <p className="mt-1 text-2xl font-semibold">{adminCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3.5">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Testers on page</p>
            <p className="mt-1 text-2xl font-semibold">{testerCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20">
          <CardTitle className="text-xl">User Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2.5">
            <Input
              aria-label="Search users"
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
              }}
            >
              Clear
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-border/70 bg-background/70 p-2">
            <Select
              aria-label="Select role for bulk update"
              value={bulkRole}
              onChange={(event) => setBulkRole(event.target.value)}
              className="max-w-52"
            >
              <option value="">Set role...</option>
              <option value="USER">User</option>
              <option value="TESTER">Tester</option>
              <option value="ADMIN">Admin</option>
            </Select>
            <Button onClick={handleBulkRole} disabled={!bulkRole || selected.length === 0}>
              Apply role
            </Button>
            <Badge variant="secondary">{selected.length} selected</Badge>
          </div>

          <Table className="rounded-xl border border-border/70 bg-card/40">
            <caption className="sr-only">Admin users table with bulk selection</caption>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <input
                    aria-label="Select all users on page"
                    type="checkbox"
                    className="h-4 w-4 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    checked={selected.length === users.length && users.length > 0}
                    onChange={(event) => setSelected(event.target.checked ? users.map((user) => user.id) : [])}
                  />
                </TableHead>
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
                    <input
                      aria-label={`Select user ${user.email}`}
                      type="checkbox"
                      className="h-4 w-4 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      checked={selected.includes(user.id)}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => toggleSelect(user.id)}
                    />
                  </TableCell>
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
                    <div className="relative inline-flex w-32 items-center">
                      <Select
                        aria-label={`Change role for ${user.email}`}
                        value={user.role}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          event.stopPropagation();
                          void updateSingleRole(user.id, event.target.value);
                        }}
                        className="h-8 rounded-full border-border/70 bg-background/80 pl-3 pr-8 text-[11px] font-semibold uppercase tracking-[0.12em]"
                      >
                        <option value="USER">User</option>
                        <option value="TESTER">Tester</option>
                        <option value="ADMIN">Admin</option>
                      </Select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    </div>
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
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
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
