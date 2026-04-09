"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FileClock,
  LayoutDashboard,
  LogOut,
  Settings2,
  Shield,
  Ticket,
  ListChecks,
} from "lucide-react";

import NotificationBell from "@/components/notifications/NotificationBell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavIcon = "dashboard" | "issues" | "admin" | "settings" | "audit";

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
    case "settings":
      return Settings2;
    case "audit":
      return FileClock;
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
  const [expanded, setExpanded] = useState(false);

  const sidebarExpanded = expanded;

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-16 flex-col border-r border-border/70 bg-card/95 backdrop-blur-md transition-[width] duration-200 md:w-20",
          sidebarExpanded ? "lg:w-60" : "lg:w-20",
        )}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onFocusCapture={() => setExpanded(true)}
        onBlurCapture={() => setExpanded(false)}>
        <div
          className={cn(
            "flex h-16 items-center justify-center border-b border-border/70 px-2",
            sidebarExpanded ? "lg:justify-start lg:px-4" : "lg:justify-center lg:px-2",
          )}>
          <Link href="/issues" className="flex items-center gap-3 outline-none">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 ring-1 ring-primary/10">
              <Ticket className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            </span>
            <span
              className={cn(
                "hidden min-w-0 overflow-hidden transition-all duration-200 lg:block",
                sidebarExpanded ? "lg:max-w-[180px] lg:opacity-100" : "lg:max-w-0 lg:opacity-0",
              )}>
              <span className="block text-sm font-semibold tracking-tight text-foreground">
                IssueTracker
              </span>
            </span>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-2">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = getIcon(item.icon);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-11 items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200",
                  sidebarExpanded ? "lg:justify-start" : "lg:justify-center",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}>
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span
                  className={cn(
                    "hidden truncate overflow-hidden transition-all duration-200 lg:block",
                    sidebarExpanded ? "lg:max-w-[140px] lg:opacity-100" : "lg:max-w-0 lg:opacity-0",
                  )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/70 p-2">
          <div className="space-y-2">
            <NotificationBell
              className={cn(
                "h-11 w-full rounded-xl border border-border/70 bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                sidebarExpanded ? "justify-start lg:px-3" : "justify-center lg:px-2",
              )}
            />
            <Button
              asChild
              variant="outline"
              className={cn(
                "h-11 w-full rounded-xl border-border/70",
                sidebarExpanded ? "justify-start lg:px-3" : "justify-center lg:px-2",
              )}>
              <Link href="/logout" aria-label="Logout">
                <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span
                  className={cn(
                    "hidden overflow-hidden transition-all duration-200 lg:inline",
                    sidebarExpanded ? "lg:max-w-[110px] lg:opacity-100" : "lg:max-w-0 lg:opacity-0",
                  )}>
                  Logout
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </aside>

      <div
        className={cn(
          "min-h-screen pl-16 transition-[padding] duration-200 md:pl-20",
          sidebarExpanded ? "lg:pl-60" : "lg:pl-20",
        )}>
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between gap-3 px-3 md:px-4 lg:px-6">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                Workspace
              </p>
            </div>

            <div className="flex items-center gap-2">
              {role && (
                <Badge variant="outline" className="hidden sm:inline-flex">
                  {role}
                </Badge>
              )}
              <div className="group relative">
                <button
                  type="button"
                  aria-label={`Profile: ${profileName}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-muted/50 text-xs font-semibold text-primary shadow-sm transition-colors hover:bg-accent">
                  {profileInitials}
                </button>
                <div className="pointer-events-none absolute right-0 top-11 z-40 min-w-[200px] rounded-xl border border-border/70 bg-popover/95 px-3 py-2.5 opacity-0 shadow-lg backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                  <p className="truncate text-xs font-semibold leading-tight text-foreground">
                    {profileName}
                  </p>
                  <p className="truncate text-[11px] leading-tight text-muted-foreground">
                    {profileEmail}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main id="main-content" className="page-enter w-full px-3 py-3 md:px-4 md:py-4 lg:px-6 lg:py-5">
          {children}
        </main>
      </div>
    </div>
  );
}