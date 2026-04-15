"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  List,
  Moon,
  Rows3,
  UsersRound,
  SunMedium,
  ChevronsLeft,
  ChevronsRight,
  Ticket,
} from "lucide-react";

import NotificationBell from "@/components/notifications/NotificationBell";
import { CommandPalette } from "@/components/layout/CommandPalette";
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
}: {
  children: React.ReactNode;
  navItems: AppNavItem[];
  profileName: string;
  profileEmail: string;
}) {
  const pathname = usePathname();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [density, setDensity] = useState<"comfortable" | "compact">(
    "comfortable",
  );
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
    window.localStorage.setItem(
      "app-shell-sidebar-expanded",
      String(sidebarExpanded),
    );
  }, [sidebarExpanded]);

  useEffect(() => {
    const stored = window.localStorage.getItem("app-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
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
    const stored = window.localStorage.getItem("app-density");
    const nextDensity = stored === "compact" ? "compact" : "comfortable";
    setDensity(nextDensity);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("ui-density-compact", "ui-density-comfortable");
    root.classList.add(
      density === "compact" ? "ui-density-compact" : "ui-density-comfortable",
    );
    window.localStorage.setItem("app-density", density);
  }, [density]);

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
    window.localStorage.setItem("app-theme", nextTheme);
    applyTheme(nextTheme, true);
  }

  function toggleDensity() {
    setDensity((current) =>
      current === "compact" ? "comfortable" : "compact",
    );
  }

  const sidebarWidthClass = sidebarExpanded ? "w-52 md:w-56" : "w-16 md:w-20";
  const contentOffsetClass = sidebarExpanded
    ? "pl-52 md:pl-56"
    : "pl-16 md:pl-20";

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border/80 bg-gradient-to-b from-card/95 via-card/90 to-muted/35 shadow-[10px_0_34px_rgba(15,23,42,0.09)] backdrop-blur-xl transition-[width] duration-200 ease-out",
          sidebarWidthClass,
        )}>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-2 top-2 h-20 rounded-2xl bg-gradient-to-r from-primary/20 via-chart-2/18 to-chart-4/15 blur-2xl"
        />
        <div className="flex h-16 items-center justify-between gap-2 border-b border-border/80 px-3">
          <Link
            href="/issues"
            className="flex min-w-0 items-center gap-3 outline-none">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/75 text-primary-foreground shadow-md shadow-primary/30 ring-1 ring-primary/20">
              <Ticket className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            </span>
            <span
              className={cn(
                "min-w-0 overflow-hidden text-sm font-semibold tracking-wide text-foreground transition-all duration-200",
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
            className="h-11 w-11 shrink-0 rounded-full border-border/80 bg-background/80 text-muted-foreground shadow-sm hover:border-primary/35 hover:text-foreground md:h-9 md:w-9">
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

        <nav className="flex flex-1 flex-col gap-1.5 p-2 pt-2">
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
                  "group relative flex h-10 items-center rounded-xl text-[13px] font-medium transition-all duration-200",
                  sidebarExpanded
                    ? "justify-start gap-3 px-3"
                    : "justify-center px-2",
                  active
                    ? "bg-gradient-to-r from-primary to-primary/85 text-primary-foreground shadow-md shadow-primary/30"
                    : "text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground",
                )}>
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-2 h-6 w-1 rounded-r-full bg-white/90"
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
          "min-h-screen transition-[padding-left] duration-200 ease-out",
          contentOffsetClass,
        )}>
        <header className="sticky top-0 z-30 bg-transparent pt-2">
          <div className="page-shell flex min-h-12 items-start justify-end px-2.5 py-1.5 md:px-3 lg:px-4">
            <div ref={profileMenuRef} className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-6 -top-1 -z-10 h-8 rounded-full bg-gradient-to-r from-primary/25 via-chart-2/10 to-chart-4/20 blur-xl"
              />
              <div className="flex items-center gap-2 rounded-[1.25rem] border border-border/80 bg-gradient-to-br from-card/95 via-card/90 to-muted/30 px-2 py-1.5 shadow-[0_14px_34px_rgba(15,23,42,0.11)] backdrop-blur-xl ring-1 ring-white/35 dark:ring-white/5">
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
                  className="h-11 w-11 rounded-full border-border/80 bg-background/75 text-muted-foreground shadow-sm hover:-translate-y-0.5 hover:border-primary/35 hover:bg-background hover:text-foreground hover:shadow-md md:h-9 md:w-9">
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
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={toggleDensity}
                  aria-label={
                    density === "compact"
                      ? "Switch to comfortable density"
                      : "Switch to compact density"
                  }
                  title={
                    density === "compact"
                      ? "Comfortable density"
                      : "Compact density"
                  }
                  className="h-11 w-11 rounded-full border-border/80 bg-background/75 text-muted-foreground shadow-sm hover:-translate-y-0.5 hover:border-primary/35 hover:bg-background hover:text-foreground hover:shadow-md md:h-9 md:w-9">
                  {density === "compact" ? (
                    <List
                      className={ICON_STYLE.control}
                      strokeWidth={ICON_STROKE.control}
                      aria-hidden="true"
                    />
                  ) : (
                    <Rows3
                      className={ICON_STYLE.control}
                      strokeWidth={ICON_STROKE.control}
                      aria-hidden="true"
                    />
                  )}
                </Button>
                <NotificationBell className="h-11 w-11 border-border/80 bg-background/75 text-muted-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-background hover:text-foreground hover:shadow-md md:h-9 md:w-9" />
                <Button
                  type="button"
                  variant="outline"
                  aria-label={`Profile menu for ${profileName}`}
                  aria-expanded={profileMenuOpen}
                  onClick={() => setProfileMenuOpen((current) => !current)}
                  className="group h-11 gap-0 rounded-full border-border/80 bg-background/75 px-1.5 text-xs font-medium text-foreground shadow-sm hover:-translate-y-0.5 hover:border-primary/35 hover:bg-background hover:shadow-md md:h-9">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/35 to-chart-2/10 text-[10px] font-semibold text-primary ring-1 ring-primary/35">
                    {profileInitials}
                  </span>
                  <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:ml-2 group-hover:max-w-[120px] group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-[120px] group-focus-visible:opacity-100">
                    {profileName}
                  </span>
                </Button>
                <CommandPalette />
              </div>

              {profileMenuOpen && (
                <Card className="absolute right-0 top-12 z-50 w-64 rounded-2xl border-border/80 p-2.5 shadow-lg shadow-black/10">
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                    <p className="truncate text-xs text-muted-foreground">
                      {profileEmail}
                    </p>
                  </div>
                  <div className="mt-2">
                    <Button asChild variant="outline" className="h-9 w-full rounded-full border-border/70 bg-card/80 px-3 text-xs">
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
                className="pointer-events-none absolute -right-2 top-1/2 h-5 w-5 -translate-y-1/2 rounded-br-2xl border-b border-r border-border/70"
              />
            </div>
          </div>
        </header>

        <main
          id="main-content"
          className="page-enter page-shell w-full"
          style={{
            paddingInline: "var(--space-page-x)",
            paddingBlock: "var(--space-page-y)",
          }}>
          {children}
        </main>
      </div>
    </div>
  );
}
