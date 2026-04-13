"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileClock,
  LayoutDashboard,
  LogOut,
  Moon,
  Shield,
  SunMedium,
  ChevronsLeft,
  ChevronsRight,
  Ticket,
  ListChecks,
} from "lucide-react";

import NotificationBell from "@/components/notifications/NotificationBell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      return ListChecks;
    case "admin":
      return Shield;
    case "audit":
      return FileClock;
  }
}

function getShellContext(pathname: string) {
  if (pathname.startsWith("/dashboard")) {
    return { title: "Dashboard", description: "Compact issue trends and activity." };
  }
  if (pathname.startsWith("/issues")) {
    return { title: "Issues", description: "Browse, filter, and resolve work items." };
  }
  if (pathname.startsWith("/admin/users")) {
    return { title: "Admin", description: "User access and role management." };
  }
  if (pathname.startsWith("/admin/audit-log")) {
    return { title: "Audit Log", description: "System activity and change history." };
  }
  if (pathname.startsWith("/admin/settings")) {
    return { title: "Activity", description: "Exports and system records." };
  }
  return { title: "Issue Tracker", description: "Current page activity and navigation." };
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
  profileInitials,
  profileEmail,
  role,
}: {
  children: React.ReactNode;
  navItems: AppNavItem[];
  profileName: string;
  profileInitials: string;
  profileEmail: string;
  role?: string;
}) {
  const pathname = usePathname();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const themeTransitionTimeoutRef = useRef<number | null>(null);

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
    window.localStorage.setItem(
      "app-shell-sidebar-expanded",
      String(sidebarExpanded),
    );
  }, [sidebarExpanded]);

  useEffect(() => {
    const stored = window.localStorage.getItem("app-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = stored === "dark" || stored === "light"
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

  const shellContext = getShellContext(pathname);

  const sidebarWidthClass = sidebarExpanded
    ? "w-52 md:w-56"
    : "w-16 md:w-20";
  const contentOffsetClass = sidebarExpanded
    ? "pl-52 md:pl-56"
    : "pl-16 md:pl-20";

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border/70 bg-card/95 shadow-[8px_0_30px_rgba(15,23,42,0.04)] backdrop-blur-md transition-[width] duration-200 ease-out",
          sidebarWidthClass,
        )}>
        <div className="flex h-16 items-center justify-between gap-2 border-b border-border/70 px-3">
          <Link href="/issues" className="flex min-w-0 items-center gap-3 outline-none">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 ring-1 ring-primary/10">
              <Ticket className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            </span>
            <span
              className={cn(
                "min-w-0 overflow-hidden text-sm font-semibold tracking-wide text-foreground transition-all duration-200",
                sidebarExpanded ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0",
              )}>
              IssueTracker
            </span>
          </Link>

          <button
            type="button"
            aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-pressed={sidebarExpanded}
            onClick={() => setSidebarExpanded((current) => !current)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
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
                )}>
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span
                  className={cn(
                    "min-w-0 overflow-hidden whitespace-nowrap transition-all duration-200",
                    sidebarExpanded ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0",
                  )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div
        className={cn("min-h-screen transition-[padding-left] duration-200 ease-out", contentOffsetClass)}>
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-md">
          <div className="page-shell flex min-h-12 items-center justify-between gap-3 px-2.5 py-1.5 md:px-3 lg:px-4">
            <div className="min-w-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {shellContext.title}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {shellContext.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <button
                type="button"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                onClick={toggleTheme}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card/80 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                {theme === "dark" ? (
                  <SunMedium className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Moon className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
              <NotificationBell className="h-10 w-10 shrink-0" />
              <div ref={profileMenuRef} className="relative">
                  <button
                    type="button"
                    aria-label={`Profile menu for ${profileName}`}
                    aria-expanded={profileMenuOpen}
                    onClick={() => setProfileMenuOpen((current) => !current)}
                    className="flex h-9 items-center gap-2 rounded-full border border-border/70 bg-card/80 px-2.5 text-left transition-colors hover:bg-accent">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      {profileInitials}
                    </span>
                    <span className="hidden max-w-[120px] truncate text-xs font-medium text-foreground sm:block">
                      {profileName}
                    </span>
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-border/70 bg-card p-2 shadow-lg shadow-black/10">
                      <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
                        <p className="truncate text-sm font-medium text-foreground">{profileName}</p>
                        <p className="truncate text-xs text-muted-foreground">{profileEmail}</p>
                        {role && (
                          <Badge variant="outline" className="mt-1 rounded-full px-2 py-0 text-[10px] font-semibold uppercase tracking-wide">
                            {role}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 grid gap-1">
                        <Button asChild variant="ghost" size="sm" className="justify-start">
                          <Link href="/logout">
                            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                            Logout
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
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