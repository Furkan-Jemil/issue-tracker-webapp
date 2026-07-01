"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardList,
  History,
  LayoutDashboard,
  Menu,
  PanelLeft,
  PanelRight,
  Plus,
  User,
  UsersRound,
  Ticket,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/layout/command-palette";
import { ICON_STROKE, ICON_STYLE } from "@/lib/uiTokens";
import { cn } from "@/lib/utils";
import { AppShellProfileProvider } from "@/components/layout/app-shell-profile-context";
import { AppShellControls } from "@/components/layout/app-shell-controls";

type NavIcon = "dashboard" | "issues" | "admin" | "audit" | "notifications" | "profile";

export type AppNavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  section?: "primary" | "admin";
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
    case "notifications":
      return Bell;
    case "profile":
      return User;
  }
}

function isActive(pathname: string, href: string) {
  if (href === "/tasks") {
    return pathname === "/tasks" || pathname.startsWith("/tasks/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  children,
  navItems,
  profileName,
  profileEmail,
  profileRole,
  initialTheme,
}: {
  children: React.ReactNode;
  navItems: AppNavItem[];
  profileName: string;
  profileEmail: string;
  profileRole: string | null;
  initialTheme: "light" | "dark";
}) {
  const pathname = usePathname();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hideSidebar = pathname.startsWith("/login") || pathname.startsWith("/register");

  useEffect(() => {
    const stored = window.localStorage.getItem("app-shell-sidebar-expanded");
    if (window.innerWidth < 1024) {
      setSidebarExpanded(false);
      return;
    }
    if (stored !== null) {
      setSidebarExpanded(stored === "true");
    }
  }, []);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth < 1024) {
        setSidebarExpanded(false);
      }
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "app-shell-sidebar-expanded",
      String(sidebarExpanded),
    );
  }, [sidebarExpanded]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarWidthClass = sidebarExpanded ? "w-48 md:w-52" : "w-16";
  const contentOffsetClass = sidebarExpanded
    ? "lg:pl-48 lg:md:pl-52"
    : "lg:pl-16";
  const primaryNavItems = navItems.filter((item) => item.section !== "admin");
  const adminNavItems = navItems.filter((item) => item.section === "admin");

  if (hideSidebar) {
    return (
      <div className="min-h-screen overflow-x-clip bg-background">
        <div className="relative min-h-screen min-w-0 overflow-x-clip">
          <AppShellProfileProvider value={{ profileName, profileEmail, initialTheme, role: profileRole }}>
            <main
              id="main-content"
              className="page-enter page-shell w-full min-w-0"
              style={{
                paddingInline: "var(--space-page-x)",
                paddingTop: "var(--space-main-top)",
                paddingBottom: "var(--space-page-y)",
              }}>
              {children}
            </main>
          </AppShellProfileProvider>
        </div>
      </div>
    );
  }

  // Reusable sidebar inner content (shared between desktop fixed + mobile drawer)
  function SidebarInner() {
    return (
      <div className="flex h-full flex-col">
        {/* ── Header: Logo + collapse toggle ─────────────────────────────── */}
        <div className="flex h-14 shrink-0 items-center justify-between gap-1 border-b border-border/80 px-2.5">
          <Link
            href="/tasks"
            className="flex min-w-0 items-center gap-2 outline-none">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Ticket className="h-4.5 w-4.5" strokeWidth={2.25} aria-hidden />
            </span>
            <span
              className={cn(
                "min-w-0 overflow-hidden whitespace-nowrap text-[13px] font-semibold tracking-normal text-foreground transition-all duration-200",
                sidebarExpanded
                  ? "max-w-[168px] opacity-100"
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
            className="h-8 w-8 shrink-0 rounded-lg border border-border bg-card text-muted-foreground shadow-sm md:h-8 md:w-8">
            {sidebarExpanded ? (
              <PanelLeft className={cn(ICON_STYLE.control, "h-4 w-4")} strokeWidth={ICON_STROKE.control} aria-hidden="true" />
            ) : (
              <PanelRight className={cn(ICON_STYLE.control, "h-4 w-4")} strokeWidth={ICON_STROKE.control} aria-hidden="true" />
            )}
          </Button>
        </div>

        {/* ── New Issue CTA ────────────────────────────────────────────────── */}
        <div className="shrink-0 px-2 pt-2">
          <Button
            asChild
            size="sm"
            className={cn(
              "w-full gap-2 rounded-lg text-[12px] font-semibold transition-all duration-200",
              !sidebarExpanded && "justify-center px-0",
            )}>
            <Link href="/tasks/new" title="Create new issue">
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-200",
                  sidebarExpanded ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0",
                )}>
                New Issue
              </span>
            </Link>
          </Button>
        </div>

        {/* ── Nav items ───────────────────────────────────────────────────── */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2 pt-1.5">
          {primaryNavItems.map((item) => {
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
                {/* Left indicator: white on lime (primary-foreground) so it's actually visible */}
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-2 h-5 w-1 rounded-r-full bg-primary-foreground/80"
                  />
                ) : null}
                <Icon
                  className={ICON_STYLE.nav}
                  strokeWidth={ICON_STROKE.nav}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "min-w-0 truncate whitespace-nowrap transition-all duration-200",
                    sidebarExpanded
                      ? "max-w-[160px] opacity-100"
                      : "max-w-0 opacity-0",
                  )}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {adminNavItems.length > 0 ? (
            <div className="mt-auto space-y-1 pt-2">
              {sidebarExpanded ? (
                <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
                  Administration
                </p>
              ) : null}
              {adminNavItems.map((item) => {
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
                        className="absolute left-0 top-2 h-5 w-1 rounded-r-full bg-primary-foreground/80"
                      />
                    ) : null}
                    <Icon
                      className={ICON_STYLE.nav}
                      strokeWidth={ICON_STROKE.nav}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        "min-w-0 truncate whitespace-nowrap transition-all duration-200",
                        sidebarExpanded
                          ? "max-w-[160px] opacity-100"
                          : "max-w-0 opacity-0",
                      )}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </nav>

        {/* ── Sidebar bottom: CommandPalette + profile controls ───────────── */}
        <div className="shrink-0 space-y-1.5 border-t border-border/80 p-2">
          <CommandPalette compact={!sidebarExpanded} />
          <AppShellControls
            compact={!sidebarExpanded}
            className="pointer-events-auto relative"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      {/* ── Desktop sidebar (fixed) ──────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-card transition-[width] duration-200 ease-out lg:block",
          sidebarWidthClass,
        )}>
        <SidebarInner />
      </aside>

      {/* ── Mobile sidebar (slide-in overlay) ───────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-52 border-r border-border bg-card lg:hidden">
            <SidebarInner />
          </aside>
        </>
      )}

      {/* ── Mobile top bar ───────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-3 lg:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
          className="h-9 w-9 shrink-0 text-muted-foreground">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
        <Link href="/tasks" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Ticket className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="text-[13px] font-semibold text-foreground">IssueTracker</span>
        </Link>
        <AppShellControls compact className="pointer-events-auto relative" />
      </header>

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div
        className={cn(
          "relative min-h-screen min-w-0 overflow-x-clip transition-[padding-left] duration-200 ease-out",
          contentOffsetClass,
        )}>
        <AppShellProfileProvider value={{ profileName, profileEmail, initialTheme, role: profileRole }}>
          <main
            id="main-content"
            className="page-enter page-shell w-full min-w-0"
            style={{
              paddingInline: "var(--space-page-x)",
              // Extra top on mobile for the sticky 56px top bar
              paddingTop: "calc(var(--space-main-top) + 3.5rem)",
              paddingBottom: "var(--space-page-y)",
            }}>
            {children}
          </main>
        </AppShellProfileProvider>
      </div>
    </div>
  );
}
