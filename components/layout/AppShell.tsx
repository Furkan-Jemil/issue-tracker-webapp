"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-16 flex-col border-r border-border/70 bg-card/95 backdrop-blur-md md:w-20">
        <div className="flex h-16 items-center justify-center border-b border-border/70 px-2">
          <Link href="/issues" className="flex items-center gap-3 outline-none">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 ring-1 ring-primary/10">
              <Ticket className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            </span>
            <span className="sr-only">IssueTracker</span>
          </Link>
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
                  "group flex h-11 items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}>
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              </Link>
            );
          })}
        </nav>
      </aside>

      <div
        className={cn(
          "min-h-screen pl-16 md:pl-20",
        )}>
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-md">
          <div className="flex min-h-14 items-center justify-between gap-3 px-3 py-2 md:px-4 lg:px-6">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                Workspace
              </p>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <NotificationBell className="h-10 w-10 shrink-0" />
              <Button asChild variant="outline" size="sm" className="gap-2 rounded-full px-3">
                <Link href="/logout" aria-label="Logout">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Logout</span>
                </Link>
              </Button>
              <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 sm:flex">
                {role && (
                  <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px] font-semibold uppercase tracking-wide">
                    {role}
                  </Badge>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-tight text-foreground">
                    {profileName}
                  </p>
                  <p className="truncate text-[11px] leading-tight text-muted-foreground">
                    {profileEmail}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Profile: ${profileName}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-muted/50 text-xs font-semibold text-primary shadow-sm transition-colors hover:bg-accent">
                  {profileInitials}
                </button>
              </div>

              <div className="flex items-center gap-2 sm:hidden">
                {role && (
                  <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px] font-semibold uppercase tracking-wide">
                    {role}
                  </Badge>
                )}
                <button
                  type="button"
                  aria-label={`Profile: ${profileName}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-muted/50 text-xs font-semibold text-primary shadow-sm transition-colors hover:bg-accent">
                  {profileInitials}
                </button>
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