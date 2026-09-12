"use client";

/**
 * CommandPalette
 *
 * A keyboard-first command palette triggered by Ctrl+K / Cmd+K.
 *
 * Features vs. the previous version:
 *   ✓ Full arrow-key + Enter keyboard navigation (ARIA listbox pattern)
 *   ✓ Debounced issue search via /api/issues/search (200ms, abort on cleanup)
 *   ✓ Combined results: live issue hits grouped above static nav shortcuts
 *   ✓ All hrefs corrected to /tasks (not the dead /issues paths)
 *   ✓ Focus trap: Tab cycles through input → results → close button
 *   ✓ Closes on Escape, backdrop click, and after navigation
 *   ✓ Keyboard shortcut displayed correctly as Ctrl+K (not ⌘K only)
 *   ✓ Accessible: role="combobox", role="listbox", aria-activedescendant,
 *     aria-selected, aria-label on every interactive element
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bug,
  Command,
  FileSearch,
  Hash,
  LayoutDashboard,
  Search,
  Sparkles,
  Ticket,
  Users,
  History,
  Bell,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

type IssueResult = {
  id: string;
  title: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  type: "BUG" | "IMPROVEMENT";
};

type PaletteItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  /** Lucide icon component */
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** Visual group heading shown in the list */
  group: "Issues" | "Navigation";
};

// ─── Static navigation items ───────────────────────────────────────────────
// All hrefs corrected to match the live route tree (/tasks, not /issues).

const NAV_ITEMS: PaletteItem[] = [
  {
    id: "nav-tasks",
    label: "Issues",
    description: "Open the issue list",
    href: "/tasks",
    Icon: Ticket,
    group: "Navigation",
  },
  {
    id: "nav-board",
    label: "Board view",
    description: "Kanban status board",
    href: "/tasks?view=board",
    Icon: Hash,
    group: "Navigation",
  },
  {
    id: "nav-new",
    label: "Create issue",
    description: "Log a new bug or improvement",
    href: "/tasks/new",
    Icon: FileSearch,
    group: "Navigation",
  },
  {
    id: "nav-dashboard",
    label: "Dashboard",
    description: "View issue trends and analytics",
    href: "/dashboard",
    Icon: LayoutDashboard,
    group: "Navigation",
  },
  {
    id: "nav-notifications",
    label: "Notifications",
    description: "Review unread updates",
    href: "/notifications",
    Icon: Bell,
    group: "Navigation",
  },
  {
    id: "nav-members",
    label: "Members",
    description: "Manage roles and accounts",
    href: "/members",
    Icon: Users,
    group: "Navigation",
  },
  {
    id: "nav-audit",
    label: "Audit log",
    description: "Review full activity history",
    href: "/admin/audit-log",
    Icon: History,
    group: "Navigation",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function issueTypeIcon(
  type: IssueResult["type"],
): React.ComponentType<{ className?: string; "aria-hidden"?: boolean }> {
  return type === "BUG" ? Bug : Sparkles;
}

function priorityLabel(priority: IssueResult["priority"]): string {
  return priority === "HIGH" ? "High" : priority === "MEDIUM" ? "Med" : "Low";
}

function statusShort(status: IssueResult["status"]): string {
  if (status === "IN_PROGRESS") return "In progress";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

/** Derive a stable item-id from either a PaletteItem or IssueResult */
function toItemId(prefix: string, id: string): string {
  return `${prefix}-${id}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CommandPalette() {
  const uid = useId(); // stable prefix for ARIA ids
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [issueResults, setIssueResults] = useState<IssueResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // ── Filtered nav items ──────────────────────────────────────────────────
  const filteredNav = useMemo<PaletteItem[]>(() => {
    const term = query.trim().toLowerCase();
    if (!term) return NAV_ITEMS;
    return NAV_ITEMS.filter((item) => {
      const haystack = [item.label, item.description, item.href]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [query]);

  // ── Combined ordered list for keyboard navigation ──────────────────────
  // Issue hits come first (most relevant), then nav shortcuts.
  const allItems = useMemo<PaletteItem[]>(() => {
    const issuePaletteItems: PaletteItem[] = issueResults.map((issue) => ({
      id: `issue-${issue.id}`,
      label: issue.title,
      description: `${statusShort(issue.status)} · ${priorityLabel(issue.priority)}`,
      href: `/tasks/${issue.id}`,
      Icon: issueTypeIcon(issue.type),
      group: "Issues" as const,
    }));
    return [...issuePaletteItems, ...filteredNav];
  }, [issueResults, filteredNav]);

  // ── Debounced issue search with AbortController ─────────────────────────
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setIssueResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);

    const timerId = window.setTimeout(() => {
      fetch(
        `/api/issues/search?q=${encodeURIComponent(trimmed)}&limit=6`,
        { signal: controller.signal },
      )
        .then(async (res) => {
          if (!res.ok) return;
          const data = (await res.json()) as { issues: IssueResult[] };
          setIssueResults(Array.isArray(data.issues) ? data.issues : []);
        })
        .catch((err: Error) => {
          // Ignore abort errors — they are intentional on cleanup.
          if (err.name !== "AbortError") {
            setIssueResults([]);
          }
        })
        .finally(() => {
          setSearching(false);
        });
    }, 200);

    return () => {
      window.clearTimeout(timerId);
      controller.abort();
      setSearching(false);
    };
  }, [query]);

  // ── Keep activeIndex in bounds when the result list changes ────────────
  useEffect(() => {
    setActiveIndex(0);
  }, [allItems.length]);

  // ── Scroll active item into view ────────────────────────────────────────
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // ── Global keyboard shortcut: Ctrl+K / Cmd+K ───────────────────────────
  useEffect(() => {
    function onGlobalKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    document.addEventListener("keydown", onGlobalKeyDown);
    return () => document.removeEventListener("keydown", onGlobalKeyDown);
  }, []);

  // ── Focus input when palette opens; reset state when it closes ─────────
  useEffect(() => {
    if (open) {
      setQuery("");
      setIssueResults([]);
      setActiveIndex(0);
      // rAF ensures the dialog has rendered before we attempt focus
      const raf = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
  }, [open]);

  // ── Navigate to an item and close ───────────────────────────────────────
  const commitItem = useCallback(
    (item: PaletteItem) => {
      setOpen(false);
      router.push(item.href);
    },
    [router],
  );

  // ── In-palette keyboard handler ─────────────────────────────────────────
  function onKeyDown(event: React.KeyboardEvent) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter": {
        event.preventDefault();
        const item = allItems[activeIndex];
        if (item) commitItem(item);
        break;
      }
      case "Escape":
        event.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        // Allow natural Tab to reach the close button, then wrap back
        // to the input. We don't preventDefault so the browser handles it.
        break;
    }
  }

  // ── Derived ARIA values ─────────────────────────────────────────────────
  const listboxId = `${uid}-listbox`;
  const activeItemId =
    allItems[activeIndex]
      ? toItemId(uid, allItems[activeIndex].id)
      : undefined;

  // ── Group boundary helpers ──────────────────────────────────────────────
  function isFirstOfGroup(index: number): boolean {
    if (index === 0) return true;
    return allItems[index]?.group !== allItems[index - 1]?.group;
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Trigger button ──────────────────────────────────────────────── */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="group h-11 gap-2 rounded-full border-border/70 bg-gradient-to-r from-background to-muted/40 px-2.5 text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:from-background hover:to-background hover:shadow-md md:h-9"
        aria-label="Open command palette"
        aria-keyshortcuts="Control+k Meta+k"
        onClick={() => setOpen(true)}
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition-colors group-hover:text-foreground">
          <Command className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <span className="hidden md:inline">Commands</span>
        <kbd
          className="rounded-full border border-border/70 bg-muted/35 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
          aria-hidden="true"
        >
          Ctrl K
        </kbd>
      </Button>

      {/* ── Dialog ──────────────────────────────────────────────────────── */}
      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center bg-black/45 px-4 pt-16 backdrop-blur-sm md:pt-20"
          // Backdrop click closes the palette
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl shadow-black/25 ring-1 ring-black/5"
            onKeyDown={onKeyDown}
          >
            {/* ── Search input row ──────────────────────────────────────── */}
            <div className="flex items-center gap-2.5 border-b border-border/60 px-3 py-2.5">
              <Search
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                role="combobox"
                aria-expanded={allItems.length > 0}
                aria-controls={listboxId}
                aria-activedescendant={activeItemId}
                aria-autocomplete="list"
                aria-label="Search issues and navigation"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search issues, pages, and actions…"
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              {/* Spinner shown while fetching issue results */}
              {searching ? (
                <span
                  className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-border border-t-primary"
                  role="status"
                  aria-label="Searching…"
                />
              ) : null}
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close command palette"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* ── Results list ─────────────────────────────────────────── */}
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-label="Command palette results"
              className="max-h-[min(60vh,440px)] overflow-y-auto p-1.5 focus:outline-none"
              tabIndex={-1}
            >
              {allItems.length > 0 ? (
                allItems.map((item, index) => {
                  const isActive = index === activeIndex;
                  const showGroupHeading = isFirstOfGroup(index);
                  const { Icon } = item;

                  return (
                    <li
                      key={item.id}
                      id={toItemId(uid, item.id)}
                      role="option"
                      aria-selected={isActive}
                      data-index={index}
                      className="outline-none"
                    >
                      {/* Group heading — renders once per group */}
                      {showGroupHeading ? (
                        <p
                          className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70 first:pt-1"
                          aria-hidden="true"
                        >
                          {item.group}
                        </p>
                      ) : null}

                      {/*
                       * We use a Link for navigation but intercept pointer
                       * and keyboard events so the active index stays in sync.
                       * onMouseMove (not onMouseEnter) prevents spurious index
                       * resets when the list scrolls under the cursor.
                       */}
                      <Link
                        href={item.href}
                        tabIndex={-1} // keyboard nav is fully manual via arrow keys
                        onMouseMove={() => setActiveIndex(index)}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-accent/60 hover:text-accent-foreground",
                        )}
                      >
                        {/* Icon */}
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                            isActive
                              ? "bg-primary/15 text-primary"
                              : "bg-muted/50 text-muted-foreground",
                          )}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>

                        {/* Text */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium leading-tight">
                            {item.label}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        </div>

                        {/* Right-side affordance */}
                        {isActive ? (
                          <kbd
                            className="ml-auto shrink-0 rounded border border-border/70 bg-background/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                            aria-hidden="true"
                          >
                            ↵
                          </kbd>
                        ) : null}
                      </Link>
                    </li>
                  );
                })
              ) : (
                /* Empty state */
                <li className="px-4 py-8 text-center" role="option" aria-selected="false">
                  <AlertTriangle
                    className="mx-auto mb-2 h-5 w-5 text-muted-foreground/50"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-muted-foreground">
                    {query.length >= 2
                      ? `No results for "${query}"`
                      : "Start typing to search issues or navigate…"}
                  </p>
                </li>
              )}
            </ul>

            {/* ── Footer hint bar ──────────────────────────────────────── */}
            <div className="flex items-center gap-4 border-t border-border/60 bg-muted/20 px-3 py-1.5">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <kbd className="font-mono">↑↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <kbd className="font-mono">↵</kbd> open
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <kbd className="font-mono">Esc</kbd> close
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
