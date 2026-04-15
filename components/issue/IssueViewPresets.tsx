"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BookmarkPlus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SavedView = {
  id: string;
  name: string;
  href: string;
  createdAt: number;
};

const STORAGE_KEY = "issue-view-presets";

function loadSavedViews(): SavedView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedView[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function makeFriendlyName(href: string) {
  try {
    const url = new URL(href, window.location.origin);
    const view = url.searchParams.get("view") || "compact";
    const status = url.searchParams.get("status");
    const priority = url.searchParams.get("priority");
    const severity = url.searchParams.get("severity");
    const query = url.searchParams.get("q");
    const parts = [view.charAt(0).toUpperCase() + view.slice(1)];
    if (status) parts.push(status.replaceAll("_", " "));
    if (priority) parts.push(priority);
    if (severity) parts.push(severity);
    if (query) parts.push(`"${query}"`);
    return parts.join(" · ");
  } catch {
    return "Saved view";
  }
}

export function IssueViewPresets() {
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentHref = useMemo(() => {
    const search = searchParams.toString();
    return search ? `${pathname}?${search}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    setSavedViews(loadSavedViews());
  }, []);

  function persist(next: SavedView[]) {
    setSavedViews(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function saveCurrentView() {
    if (!currentHref) return;
    const name = window.prompt("Name this view", makeFriendlyName(currentHref));
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    const next: SavedView[] = [
      {
        id: crypto.randomUUID(),
        name: trimmed,
        href: currentHref,
        createdAt: Date.now(),
      },
      ...savedViews.filter((entry) => entry.href !== currentHref),
    ].slice(0, 6);

    persist(next);
  }

  function removeView(id: string) {
    persist(savedViews.filter((entry) => entry.id !== id));
  }

  const hasSavedViews = useMemo(() => savedViews.length > 0, [savedViews]);

  return (
    <Card tone="soft" density="dense" className="border-border/70 bg-card/80">
      <CardContent className="grid gap-2.5 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground/90">Saved views</p>
          <Badge variant="outline" className="rounded-full px-2.5 py-0 text-[10px] font-semibold uppercase tracking-[0.14em]">
            {savedViews.length} saved
          </Badge>
          <span className="text-xs text-muted-foreground">
            Keep your most-used filter combinations one click away.
          </span>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={saveCurrentView} disabled={!currentHref}>
          <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
          Save view
        </Button>
      </CardContent>

      {hasSavedViews ? (
        <div className="flex flex-wrap gap-1.5 border-t border-border/60 px-3 py-2.5">
          {savedViews.map((view) => (
            <div
              key={view.id}
              className={cn(
                "flex items-center gap-1 rounded-full border border-border/70 bg-background/80 pl-2.5 pr-1 py-0.5",
              )}
            >
              <Link href={view.href} className="max-w-[180px] truncate text-xs font-medium hover:underline">
                {view.name}
              </Link>
              <button
                type="button"
                onClick={() => removeView(view.id)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                aria-label={`Remove saved view ${view.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}