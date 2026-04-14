"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Command, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PaletteItem = {
  label: string;
  href: string;
  description: string;
  keywords: string[];
};

const PALETTE_ITEMS: PaletteItem[] = [
  {
    label: "Issues",
    href: "/issues",
    description: "Open the issue list",
    keywords: ["issues", "list", "tickets"],
  },
  {
    label: "Board view",
    href: "/issues?view=board",
    description: "Triaged status board",
    keywords: ["board", "kanban", "workflow"],
  },
  {
    label: "Create issue",
    href: "/issues/new",
    description: "Log a new issue",
    keywords: ["create", "new", "report"],
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    description: "View issue trends",
    keywords: ["dashboard", "metrics", "analytics"],
  },
  {
    label: "Notifications",
    href: "/notifications",
    description: "Review unread updates",
    keywords: ["notifications", "alerts", "inbox"],
  },
  {
    label: "Admin users",
    href: "/admin/users",
    description: "Manage roles and accounts",
    keywords: ["users", "admin", "roles"],
  },
  {
    label: "Audit log",
    href: "/admin/audit-log",
    description: "Review activity history",
    keywords: ["audit", "history", "log"],
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isPaletteShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isPaletteShortcut) {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const filteredItems = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return PALETTE_ITEMS;

    return PALETTE_ITEMS.filter((item) => {
      const haystack = [item.label, item.description, ...item.keywords]
        .join(" ")
        .toLowerCase();
      return haystack.includes(value);
    });
  }, [query]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="group h-11 gap-2 rounded-full border-border/70 bg-gradient-to-r from-background to-muted/40 px-2.5 text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:from-background hover:to-background hover:shadow-md md:h-9"
        onClick={() => setOpen(true)}>
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition-colors group-hover:text-foreground">
          <Command className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <span className="hidden md:inline">Commands</span>
        <span className="rounded-full border border-border/70 bg-muted/35 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Ctrl K
        </span>
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/40 px-4 pt-24 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl overflow-hidden rounded-3xl border border-border/70 bg-card shadow-2xl shadow-black/20"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette">
            <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
              <Search
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pages, views, and actions"
                className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => setOpen(false)}
                aria-label="Close command palette">
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-auto p-2">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between gap-4 rounded-2xl px-4 py-3 transition hover:bg-accent hover:text-accent-foreground",
                    )}
                    onClick={() => setOpen(false)}>
                    <div>
                      <div className="text-sm font-semibold">{item.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Open
                    </span>
                  </Link>
                ))
              ) : (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No matching command found.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
