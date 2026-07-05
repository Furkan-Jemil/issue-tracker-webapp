"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { LogOut, User, Mail, Shield, Calendar, Edit3, Save, X } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/users/profile")
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        setEditName(data.name || "");
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-stack">
        <PageHeader title="My Profile" description="Loading..." />
      </div>
    );
  }

  if (!user) return null;

  const initials = (user.name ?? user.email)
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel = user.role === "ADMIN" ? "Admin" : user.role === "TESTER" ? "Tester" : "User";
  const roleColor =
    user.role === "ADMIN"
      ? "border-amber-300/60 bg-amber-100/70 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"
      : user.role === "TESTER"
      ? "border-blue-300/60 bg-blue-100/70 text-blue-800 dark:bg-blue-400/15 dark:text-blue-300"
      : "border-border bg-muted/60 text-muted-foreground";

  return (
    <div className="page-stack">
      <PageHeader
        title="My Profile"
        description="Your account details."
      />

      <div className="mx-auto w-full max-w-lg">
        <Card className="overflow-hidden shadow-md">
          <div className="h-24 bg-gradient-to-br from-[hsl(var(--color-open)/0.6)] via-[hsl(var(--color-in-progress)/0.5)] to-[hsl(var(--color-resolved)/0.4)]" />

          <div className="-mt-12 flex flex-col items-center px-6 pb-6 pt-0 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-background bg-[hsl(var(--color-in-progress))] text-xl font-bold text-white shadow-lg">
              {initials}
            </div>

            {editing ? (
              <div className="mt-3 flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-9 w-48 text-center text-base font-bold"
                  placeholder="Your name"
                />
              </div>
            ) : (
              <h2 className="mt-3 text-xl font-bold text-foreground">
                {user.name || "Unnamed"}
              </h2>
            )}
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${roleColor}`}>
              <Shield className="h-3 w-3" aria-hidden="true" />
              {roleLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 divide-x divide-border/60 border-t border-border/60">
            <div className="p-4 text-center">
              <p className="text-2xl font-bold tabular-nums text-[hsl(var(--color-in-progress))]">
                {user._count?.issues ?? 0}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Issues</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-sm font-semibold text-foreground">
                {formatDate(user.createdAt)}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Since</p>
            </div>
          </div>

          <div className="space-y-0 border-t border-border/60">
            {[
              { icon: User, label: "Name", value: user.name || "—" },
              { icon: Mail, label: "Email", value: user.email },
              { icon: Shield, label: "Role", value: roleLabel },
              { icon: Calendar, label: "Joined", value: formatDate(user.createdAt) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 px-6 py-3 odd:bg-muted/30">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {label === "Name" && editing ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-7 px-2 text-sm"
                      />
                    ) : (
                      value
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border/60 px-6 py-4">
            {editing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => { setEditing(false); setEditName(user.name || ""); }}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={handleSave}
                  disabled={saving || !editName.trim()}
                >
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setEditing(true)}
                >
                  <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <a href="/logout">
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    Sign out
                  </a>
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}