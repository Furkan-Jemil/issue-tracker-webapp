"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { useHotkeys, type HotkeyBinding } from "@/hooks/use-hotkeys";

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

// ─── Inner shell that registers hotkeys and has access to router ──────────────

function AppShellInner({
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
  const router = useRouter();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const hideSidebar =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  // ── Sidebar persistence ─────────────────────────────────────────────────
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
      if (window.innerWidth < 1024) setSidebarExpanded(false);
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

  // ── Global hotkey bindings ──────────────────────────────────────────────
  //
  // All bindings are memoised so useHotkeys does not re-register on every
  // render. Add new bindings here; the hook automatically deactivates them
  // when the user is typing in an input/textarea/contenteditable.
  //
  // Registered shortcuts:
  //   C            → navigate to /tasks/new (Create issue)
  //   G then I     → navigate to /tasks     (Go to Issues)  [see note below]
  //   ?            → navigate to /dashboard (shortcut hints page — dashboard)
  //   Escape       → blur the focused element (close popovers, dropdowns)
  //
  // Note on Cmd+K: handled exclusively inside CommandPalette to avoid
  // double-registration with the shell.
  const hotkeys = useMemo<HotkeyBinding[]>(
    () => [
      {
        // C — Create issue. Mirrors Linear's "C" shortcut.
        // On /tasks: dispatches a custom event that opens the slide-over drawer
        // so the user's filter context is preserved.
        // On other pages: navigates to /tasks/new as a full-page fallback.
        key: "c",
        handler: (e) => {
          e.preventDefault();
          if (
            typeof window !== "undefined" &&
            (window.location.pathname === "/tasks" ||
              window.location.pathname.startsWith("/tasks?"))
          ) {
            window.dispatchEvent(
              new CustomEvent("issue-tracker:open-create-drawer"),
            );
          } else {
            router.push("/tasks/new");
          }
        },
      },
      {
        // ? — Open dashboard (shift+/ produces "?" on most keyboards).
        key: "?",
        shift: false, // "?" itself is the key value when Shift+/ is pressed
        handler: (e) => {
          e.preventDefault();
          router.push("/dashboard");
        },
      },
      {
        // [ — Collapse sidebar.
        key: "[",
        handler: (e) => {
          e.preventDefault();
          setSidebarExpanded(false);
        },
      },
      {
        // ] — Expand sidebar.
        key: "]",
        handler: (e) => {
          e.preventDefault();
          setSidebarExpanded(true);
        },
      },
      {
        // Escape — blur the focused element. Browsers close most Radix
        // popovers/dialogs on blur, so this acts as a universal close.
        // ignoreInputGuard: true so it works while inside an input too.
        key: "Escape",
        ignoreInputGuard: true,
        handler: () => {
          const active = document.activeElement as HTMLElement | null;
          active?.blur();
        },
      },
    ],
    [router],
  );

  useHotkeys(hotkeys);

  // ── Layout derivations ──────────────────────────────────────────────────
  const sidebarWidthClass = sidebarExpanded ? "w-48 md:w-52" : "w-24";
  const contentOffsetClass = sidebarExpanded ? "pl-48 md:pl-52" : "pl-24";
  const primaryNavItems = navItems.filter((item) => item.section !== "admin");
  const adminNavItems = navItems.filter((item) => item.section === "admin");

  // ── Auth-less pages (login / register) ─────────────────────────────────
  if (hideSidebar) {
    return (
      <div className="min-h-screen overflow-x-clip bg-background">
        <div className="relative min-h-screen min-w-0 overflow-x-clip">
          <AppShellProfileProvider
            value={{ profileName, profileEmail, initialTheme, role: profileRole }}
          >
            <main
              id="main-content"
              className="page-enter page-shell w-full min-w-0"
              style={{
                paddingInline: "var(--space-page-x)",
                paddingTop: "var(--space-main-top)",
                paddingBottom: "var(--space-page-y)",
              }}
            >
              {children}
            </main>
          </AppShellProfileProvider>
        </div>
      </div>
    );
  }

  // ── Main shell ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col transition-[width] duration-200 ease-out",
          "glass-card border-r",
          sidebarWidthClass,
        )}
      >
        {/* Sidebar header with micro top highlight */}
        <div className="relative flex h-14 items-center justify-between gap-1 border-b border-border/20 bg-accent/5 px-3">
          {/* Ambient top glow */}
          <div 
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" 
            aria-hidden="true" 
          />
          
          <Link
            href="/tasks"
            className="flex min-w-0 items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
          >
            {/* FJ logo */}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden">
              <img
                src="/logo.svg"
                alt="Furkan J. Tracker logo"
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg object-cover"
              />
            </span>
            <span
              className={cn(
                "min-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold tracking-tight text-foreground transition-all duration-200",
                sidebarExpanded
                  ? "max-w-[168px] opacity-100"
                  : "max-w-0 opacity-0",
              )}
            >
              Furkan J.
            </span>
          </Link>
          <button
            type="button"
            aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-pressed={sidebarExpanded}
            onClick={() => setSidebarExpanded((c) => !c)}
            title={sidebarExpanded ? "Collapse sidebar [ " : "Expand sidebar ]"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/30 bg-card/50 text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-all"
          >
            {sidebarExpanded ? (
              <PanelLeft
                className={cn(ICON_STYLE.control, "h-4 w-4")}
                strokeWidth={ICON_STROKE.control}
                aria-hidden="true"
              />
            ) : (
              <PanelRight
                className={cn(ICON_STYLE.control, "h-4 w-4")}
                strokeWidth={ICON_STROKE.control}
                aria-hidden="true"
              />
            )}
          </button>
        </div>

        {/* Nav items with refined micro-states */}
        <nav className="flex flex-1 flex-col gap-1 p-2 pt-1.5">
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
                  "group relative flex h-9 items-center rounded-lg text-xs font-medium transition-all duration-150",
                  sidebarExpanded
                    ? "justify-start gap-3 px-3"
                    : "justify-center px-2",
                  active
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-accent/40 hover:text-foreground border border-transparent",
                )}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-2 h-5 w-1 rounded-r-full bg-primary"
                  />
                ) : null}
                <Icon
                  className="h-4.5 w-4.5"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "min-w-0 truncate whitespace-nowrap transition-all duration-200",
                    sidebarExpanded
                      ? "max-w-[160px] opacity-100"
                      : "max-w-0 opacity-0",
                  )}
                >
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
                      "group relative flex h-9 items-center rounded-lg text-xs font-medium transition-all duration-150",
                      sidebarExpanded
                        ? "justify-start gap-3 px-3"
                        : "justify-center px-2",
                      active
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:bg-accent/40 hover:text-foreground border border-transparent",
                    )}
                  >
                    {active ? (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-2 h-5 w-1 rounded-r-full bg-primary"
                      />
                    ) : null}
                    <Icon
                      className="h-4.5 w-4.5"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        "min-w-0 truncate whitespace-nowrap transition-all duration-200",
                        sidebarExpanded
                          ? "max-w-[160px] opacity-100"
                          : "max-w-0 opacity-0",
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </nav>
      </aside>

      {/* Main content offset */}
      <div
        className={cn(
          "relative min-h-screen min-w-0 overflow-x-clip transition-[padding-left] duration-200 ease-out",
          contentOffsetClass,
        )}
      >
        <AppShellProfileProvider
          value={{ profileName, profileEmail, initialTheme, role: profileRole }}
        >
          <main
            id="main-content"
            className="page-enter page-shell w-full min-w-0"
            style={{
              paddingInline: "var(--space-page-x)",
              paddingTop: "var(--space-main-top)",
              paddingBottom: "var(--space-page-y)",
            }}
          >
            {children}
          </main>
        </AppShellProfileProvider>
      </div>
    </div>
  );
}

// ─── Public export — thin wrapper so the RSC layout.tsx signature is unchanged

export function AppShell(
  props: React.ComponentProps<typeof AppShellInner>,
) {
  return <AppShellInner {...props} />;
}
