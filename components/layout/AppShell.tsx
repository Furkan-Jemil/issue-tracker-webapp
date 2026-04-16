"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ICON_STROKE, ICON_STYLE } from "@/lib/uiTokens";
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
  initialTheme,
}: {
  children: React.ReactNode;
  navItems: AppNavItem[];
  profileName: string;
  profileEmail: string;
  initialTheme: "light" | "dark";
}) {
  const pathname = usePathname();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">(initialTheme);
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

  function persistTheme(nextTheme: "light" | "dark") {
    window.localStorage.setItem("app-theme", nextTheme);
    document.cookie = `app-theme=${nextTheme}; path=/; max-age=31536000; samesite=lax`;
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
    const nextTheme =
      stored === "dark" || stored === "light"
        ? stored
        : initialTheme;

    setTheme(nextTheme);
    persistTheme(nextTheme);
    applyTheme(nextTheme, false);
  }, [initialTheme]);

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
      if (
        target &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(target)
      ) {
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
    persistTheme(nextTheme);
    applyTheme(nextTheme, true);
  }

  const sidebarWidthClass = sidebarExpanded ? "w-44 md:w-48" : "w-14 md:w-16";
  const contentOffsetClass = sidebarExpanded
    ? "pl-44 md:pl-48"
    : "pl-14 md:pl-16";

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-card transition-[width] duration-200 ease-out",
          sidebarWidthClass,
        )}>
        <div className="flex h-14 items-center justify-between gap-2 border-b border-border/80 px-2.5">
          <Link
            href="/issues"
            className="flex min-w-0 items-center gap-2.5 outline-none">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Ticket className="h-4.5 w-4.5" strokeWidth={2.25} aria-hidden />
            </span>
            <span
              className={cn(
                "min-w-0 overflow-hidden text-[13px] font-semibold tracking-wide text-foreground transition-all duration-200",
                sidebarExpanded
                  ? "max-w-[140px] opacity-100"
                  : "max-w-0 opacity-0",
              )}>
              IssueTracker
            </span>
          </Link>

          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-pressed={sidebarExpanded}
            onClick={() => setSidebarExpanded((current) => !current)}
            title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            className="h-9 w-9 shrink-0 rounded-md border-border bg-background text-muted-foreground md:h-8 md:w-8">
            {sidebarExpanded ? (
              <ChevronsLeft
                className={ICON_STYLE.control}
                strokeWidth={ICON_STROKE.control}
                aria-hidden="true"
              />
            ) : (
              <ChevronsRight
                className={ICON_STYLE.control}
                strokeWidth={ICON_STROKE.control}
                aria-hidden="true"
              />
            )}
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 p-2 pt-1.5">
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
                  "group relative flex h-9 items-center rounded-xl text-[12px] font-medium transition-all duration-200",
                  sidebarExpanded
                    ? "justify-start gap-3 px-3"
                    : "justify-center px-2",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}>
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-2 h-6 w-1 rounded-r-full bg-primary"
                  />
                ) : null}
                <Icon
                  className={ICON_STYLE.nav}
                  strokeWidth={ICON_STROKE.nav}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "min-w-0 overflow-hidden whitespace-nowrap transition-all duration-200",
                    sidebarExpanded
                      ? "max-w-[160px] opacity-100"
                      : "max-w-0 opacity-0",
                  )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div
        className={cn(
          "relative min-h-screen transition-[padding-left] duration-200 ease-out",
          contentOffsetClass,
        )}>
        <header className="pointer-events-none fixed inset-x-0 top-1 z-30 bg-transparent">
          <div className="page-shell flex justify-end px-2.5 py-0 md:px-3 lg:px-4">
            <div ref={profileMenuRef} className="pointer-events-auto relative">
              <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-1.5 py-1 shadow-sm">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={
                    theme === "dark"
                      ? "Switch to light mode"
                      : "Switch to dark mode"
                  }
                  onClick={toggleTheme}
                  title={
                    theme === "dark"
                      ? "Switch to light mode"
                      : "Switch to dark mode"
                  }
                  className="h-9 w-9 rounded-md border-border bg-background text-muted-foreground md:h-8 md:w-8">
                  {theme === "dark" ? (
                    <SunMedium
                      className={ICON_STYLE.control}
                      strokeWidth={ICON_STROKE.control}
                      aria-hidden="true"
                    />
                  ) : (
                    <Moon
                      className={ICON_STYLE.control}
                      strokeWidth={ICON_STROKE.control}
                      aria-hidden="true"
                    />
                  )}
                </Button>
                <NotificationBell className="h-9 w-9 border-border bg-background text-muted-foreground md:h-8 md:w-8" />
                <Button
                  type="button"
                  variant="outline"
                  aria-label={`Profile menu for ${profileName}`}
                  aria-expanded={profileMenuOpen}
                  onClick={() => setProfileMenuOpen((current) => !current)}
                  className="group h-9 gap-0 rounded-md border-border bg-background px-1 text-xs font-medium text-foreground md:h-8">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-semibold text-foreground">
                    {profileInitials}
                  </span>
                  <span className="ml-2 max-w-[120px] overflow-hidden whitespace-nowrap opacity-100 transition-all duration-200">
                    {profileName}
                  </span>
                </Button>
              </div>

              {profileMenuOpen && (
                <Card className="absolute right-0 top-12 z-50 w-64 rounded-xl border-border p-2.5 shadow-md">
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="truncate text-xs text-muted-foreground">
                      {profileEmail}
                    </p>
                  </div>
                  <div className="mt-2">
                    <Button asChild variant="outline" className="h-9 w-full rounded-md border-border bg-card px-3 text-xs">
                      <Link href="/logout">
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Logout
                      </Link>
                    </Button>
                  </div>
                </Card>
              )}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 top-1/2 h-5 w-5 -translate-y-1/2 rounded-br-lg border-b border-r border-border/70"
              />
            </div>
          </div>
        </header>

        <main
          id="main-content"
          className="page-enter page-shell w-full"
          style={{
            paddingInline: "var(--space-page-x)",
            paddingTop: "1.25rem",
            paddingBottom: "var(--space-page-y)",
          }}>
          {children}
        </main>
      </div>
    </div>
  );
}
