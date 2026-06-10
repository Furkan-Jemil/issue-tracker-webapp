"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  History,
  LayoutDashboard,
  PanelLeft,
  PanelRight,
  UsersRound,
  Ticket,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ICON_STROKE, ICON_STYLE } from "@/lib/uiTokens";
import { cn } from "@/lib/utils";
import { AppShellProfileProvider } from "@/components/layout/app-shell-profile-context";

type NavIcon = "dashboard" | "issues" | "admin" | "audit";

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

  const sidebarWidthClass = sidebarExpanded ? "w-48 md:w-52" : "w-14 md:w-16";
  const contentOffsetClass = sidebarExpanded
    ? "pl-48 md:pl-52"
    : "pl-14 md:pl-16";
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

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-card transition-[width] duration-200 ease-out",
          sidebarWidthClass,
        )}>
        <div className="flex h-14 items-center justify-between gap-2 border-b border-border/80 px-2.5">
          <Link
            href="/tasks"
            className="flex min-w-0 items-center gap-2.5 outline-none">
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
          {sidebarExpanded ? (
            <div className="flex items-center">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Collapse sidebar"
                aria-pressed={sidebarExpanded}
                onClick={() => setSidebarExpanded((current) => !current)}
                title="Collapse sidebar"
                className="h-8 w-8 shrink-0 rounded-lg border border-border bg-card text-muted-foreground shadow-sm md:h-8 md:w-8">
                <PanelLeft className={cn(ICON_STYLE.control, "h-4 w-4")} strokeWidth={ICON_STROKE.control} aria-hidden="true" />
              </Button>
            </div>
          ) : null}
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 p-2 pt-1.5">
          {!sidebarExpanded ? (
            <div className="mb-1 flex justify-center border-b border-border/50 pb-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Expand sidebar"
                aria-pressed={sidebarExpanded}
                onClick={() => setSidebarExpanded((current) => !current)}
                title="Expand sidebar"
                className="h-8 w-8 shrink-0 rounded-lg border border-border bg-card text-muted-foreground shadow-sm md:h-8 md:w-8">
                <PanelRight className={cn(ICON_STYLE.control, "h-4 w-4")} strokeWidth={ICON_STROKE.control} aria-hidden="true" />
              </Button>
            </div>
          ) : null}
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
            <div className="mt-auto space-y-1.5 pt-2">
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
      </aside>

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
