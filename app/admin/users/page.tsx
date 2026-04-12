"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetch(
      `/api/admin/users?search=${encodeURIComponent(debouncedSearch)}&page=${page}&pageSize=${pageSize}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
        setTotal(data.total || 0);
      });
  }, [debouncedSearch, page]);

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
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
    // Refresh
    fetch(`/api/admin/users?search=${encodeURIComponent(search)}`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
        setTotal(data.total || 0);
      });
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const adminCount = users.filter((user) => user.role === "ADMIN").length;
  const testerCount = users.filter((user) => user.role === "TESTER").length;

  function roleVariant(role: string) {
    if (role === "ADMIN") return "destructive" as const;
    if (role === "TESTER") return "secondary" as const;
    return "outline" as const;
  }

  return (
    <div className="page-stack">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Visible users</p>
            <p className="mt-1 text-2xl font-semibold">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Admins on page</p>
            <p className="mt-1 text-2xl font-semibold">{adminCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Testers on page</p>
            <p className="mt-1 text-2xl font-semibold">{testerCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20">
          <CardTitle className="text-xl">User Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Input
              aria-label="Search users"
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-64 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setSearch("")}>
              Clear
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-background/70 p-2.5">
            <Select
              aria-label="Select role for bulk update"
              value={bulkRole}
              onChange={(e) => setBulkRole(e.target.value)}
              className="max-w-52">
              <option value="">Set role...</option>
              <option value="USER">User</option>
              <option value="TESTER">Tester</option>
              <option value="ADMIN">Admin</option>
            </Select>
            <Button
              onClick={handleBulkRole}
              disabled={!bulkRole || selected.length === 0}>
              Apply role
            </Button>
            <Badge variant="secondary">{selected.length} selected</Badge>
          </div>
          <Table className="rounded-xl border border-border/70 bg-card/40">
            <caption className="sr-only">
              Admin users table with bulk selection
            </caption>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <input
                    aria-label="Select all users on page"
                    type="checkbox"
                    className="h-4 w-4 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    checked={
                      selected.length === users.length && users.length > 0
                    }
                    onChange={(e) =>
                      setSelected(
                        e.target.checked ? users.map((u) => u.id) : [],
                      )
                    }
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
                <TableRow key={user.id}>
                  <TableCell>
                    <input
                      aria-label={`Select user ${user.email}`}
                      type="checkbox"
                      className="h-4 w-4 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      checked={selected.includes(user.id)}
                      onChange={() => toggleSelect(user.id)}
                    />
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleVariant(user.role)}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-primary hover:underline">
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
            <span className="text-sm text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}>
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
