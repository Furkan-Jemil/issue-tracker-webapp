"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

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

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <div className="flex gap-4 mb-4">
        <input
          aria-label="Search users"
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-1 w-full"
        />
        <button
          type="button"
          onClick={() => setSearch("")}
          className="px-2 py-1 bg-gray-200 rounded">
          Clear
        </button>
      </div>
      <div className="flex gap-2 mb-4 items-center">
        <select
          aria-label="Select role for bulk update"
          value={bulkRole}
          onChange={(e) => setBulkRole(e.target.value)}
          className="border rounded px-2 py-1">
          <option value="">Bulk set role...</option>
          <option value="USER">User</option>
          <option value="TESTER">Tester</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button
          onClick={handleBulkRole}
          className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
          disabled={!bulkRole || selected.length === 0}>
          Apply
        </button>
        <span className="text-sm text-gray-500">
          {selected.length} selected
        </span>
      </div>
      <table className="w-full border mb-8">
        <caption className="sr-only">
          Admin users table with bulk selection
        </caption>
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">
              <input
                aria-label="Select all users on page"
                type="checkbox"
                checked={selected.length === users.length && users.length > 0}
                onChange={(e) =>
                  setSelected(e.target.checked ? users.map((u) => u.id) : [])
                }
              />
            </th>
            <th scope="col" className="p-2">
              Name
            </th>
            <th scope="col" className="p-2">
              Email
            </th>
            <th scope="col" className="p-2">
              Role
            </th>
            <th scope="col" className="p-2">
              Created
            </th>
            <th scope="col" className="p-2">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t">
              <td className="p-2">
                <input
                  aria-label={`Select user ${user.email}`}
                  type="checkbox"
                  checked={selected.includes(user.id)}
                  onChange={() => toggleSelect(user.id)}
                />
              </td>
              <td className="p-2">{user.name}</td>
              <td className="p-2">{user.email}</td>
              <td className="p-2">{user.role}</td>
              <td className="p-2">
                {new Date(user.createdAt).toLocaleString()}
              </td>
              <td className="p-2">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="text-blue-600 hover:underline">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50">
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
