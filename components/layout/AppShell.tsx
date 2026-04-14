"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  FileClock,
  History,
  LayoutDashboard,
  LogOut,
  Moon,
  UsersRound,
  SunMedium,
  ChevronsLeft,
  ChevronsRight,
  Ticket,
} from "lucide-react";

import NotificationBell from "@/components/notifications/NotificationBell";
import { cn } from "@/lib/utils";

type NavIcon = "dashboard" | "issues" | "admin" | "audit";

export type AppNavItem = {
  href: string;
  label: string;
  icon: NavIcon;
};

function getIcon(icon: NavIcon) {
  switch (icon) {
    case "dashboard":
      return LayoutDashboard;
    case "issues":
      return ClipboardList;
    case "admin":
      return UsersRound;
    case "audit":
      return History;
  }
}

function isActive(pathname: string, href: string) {
  if (href === "/issues") {
    return pathname === "/issues" || pathname.startsWith("/issues/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  children,
  navItems,
  profileName,
  profileEmail,
}: {
  children: React.ReactNode;
  navItems: AppNavItem[];
  profileName: string;
  profileEmail: string;
}) {
  const pathname = usePathname();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const themeTransitionTimeoutRef = useRef<number | null>(null);
  const profileInitials =
    profileName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U";

  function applyTheme(nextTheme: "light" | "dark", animated: boolean) {
    const root = document.documentElement;
    if (animated) {
      root.classList.add("theme-transition");
      if (themeTransitionTimeoutRef.current !== null) {
        window.clearTimeout(themeTransitionTimeoutRef.current);
      }
      themeTransitionTimeoutRef.current = window.setTimeout(() => {
        root.classList.remove("theme-transition");
        themeTransitionTimeoutRef.current = null;
      }, 220);
    }
    root.classList.toggle("dark", nextTheme === "dark");
  }

  useEffect(() => {
    const stored = window.localStorage.getItem("app-shell-sidebar-expanded");
    if (stored !== null) {
      setSidebarExpanded(stored === "true");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("app-shell-sidebar-expanded", String(sidebarExpanded));
  }, [sidebarExpanded]);

  useEffect(() => {
    const stored = window.localStorage.getItem("app-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme =
      stored === "dark" || stored === "light"
        ? stored
        : prefersDark
          ? "dark"
          : "light";

    setTheme(nextTheme);
    applyTheme(nextTheme, false);
  }, []);

  useEffect(() => {
    return () => {
      if (themeTransitionTimeoutRef.current !== null) {
        window.clearTimeout(themeTransitionTimeoutRef.current);
      }
      document.documentElement.classList.remove("theme-transition");
    };
  }, []);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!profileMenuOpen) return;
      const target = event.target as Node | null;
      if (target && profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profileMenuOpen]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem("app-theme", nextTheme);
    applyTheme(nextTheme, true);
  }

  const sidebarWidthClass = sidebarExpanded ? "w-52 md:w-56" : "w-16 md:w-20";
  const contentOffsetClass = sidebarExpanded ? "pl-52 md:pl-56" : "pl-16 md:pl-20";

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border/70 bg-card/95 shadow-[8px_0_30px_rgba(15,23,42,0.04)] backdrop-blur-md transition-[width] duration-200 ease-out",
          sidebarWidthClass,
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-border/70 px-3">
          <Link href="/issues" className="flex min-w-0 items-center gap-3 outline-none">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 ring-1 ring-primary/10">
              <Ticket className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            </span>
            <span
              className={cn(
                "min-w-0 overflow-hidden text-sm font-semibold tracking-wide text-foreground transition-all duration-200",
                sidebarExpanded ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0",
              )}
            >
              IssueTracker
            </span>
          </Link>

          <button
            type="button"
            aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-pressed={sidebarExpanded}
            onClick={() => setSidebarExpanded((current) => !current)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {sidebarExpanded ? (
              <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronsRight className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-2 pt-2">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = getIcon(item.icon);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className={cn(
                  "group flex h-10 items-center rounded-xl text-[13px] font-medium transition-all duration-200",
                  sidebarExpanded ? "justify-start gap-3 px-3" : "justify-center px-2",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span
                  className={cn(
                    "min-w-0 overflow-hidden whitespace-nowrap transition-all duration-200",
                    sidebarExpanded ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={cn("min-h-screen transition-[padding-left] duration-200 ease-out", contentOffsetClass)}>
        <header className="sticky top-0 z-30 bg-transparent pt-2">
          <div className="page-shell flex min-h-12 items-start justify-end px-2.5 py-1.5 md:px-3 lg:px-4">
            <div ref={profileMenuRef} className="relative">
              <div className="flex items-center gap-2 rounded-l-full rounded-r-2xl border border-border/70 bg-background/90 px-1.5 py-1 shadow-sm backdrop-blur-md">
                <button
                  type="button"
                  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  onClick={toggleTheme}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card/80 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {theme === "dark" ? (
                    <SunMedium className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Moon className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
                <NotificationBell className="h-9 w-9 border-border/70 bg-card/80 text-muted-foreground hover:bg-accent hover:text-accent-foreground" />
                <button
                  type="button"
                  aria-label={`Profile menu for ${profileName}`}
                  aria-expanded={profileMenuOpen}
                  onClick={() => setProfileMenuOpen((current) => !current)}
                  className="group inline-flex h-9 items-center gap-0 rounded-full border border-border/70 bg-card/80 px-1.5 text-xs font-medium text-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                    {profileInitials}
                  </span>
                  <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:ml-2 group-hover:max-w-[120px] group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-[120px] group-focus-visible:opacity-100">
                    {profileName}
                  </span>
                </button>
              </div>

              {profileMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-border/70 bg-card p-2 shadow-lg shadow-black/10">
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <p className="truncate text-xs text-muted-foreground">{profileEmail}</p>
                  </div>
                  <div className="mt-2">
                    <Link
                      href="/logout"
                      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Logout
                    </Link>
                  </div>
                </div>
              )}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 top-1/2 h-5 w-5 -translate-y-1/2 rounded-br-2xl border-b border-r border-border/70"
              />
            </div>
          </div>
        </header>

        <main id="main-content" className="page-enter page-shell w-full px-3 py-3 md:px-4 md:py-4 lg:px-5 lg:py-5">
          {children}
        </main>
      </div>
    </div>
  );
}
