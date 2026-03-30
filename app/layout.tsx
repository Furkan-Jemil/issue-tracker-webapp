import "../styles/tailwind.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { LogOut, Ticket } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import { MainNav, type MainNavItem } from "@/components/layout/MainNav";
import { getAppSession } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

function buildNavItems(role: string | undefined): MainNavItem[] {
  const items: MainNavItem[] = [];
  if (role === "ADMIN") {
    items.push({ href: "/dashboard", label: "Dashboard" });
  }
  items.push({ href: "/issues", label: "Issues" });
  if (role === "ADMIN") {
    items.push(
      { href: "/admin/users", label: "Admin" },
      { href: "/admin/settings", label: "Settings" },
      { href: "/admin/audit-log", label: "Audit Log" },
    );
  }
  return items;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAppSession();
  const profileName = session?.user?.name?.trim() || "Signed-in User";
  const profileEmail = session?.user?.email?.trim() || "No email";
  const profileInitials =
    profileName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U";

  const navItems = buildNavItems(session?.user?.role);

  return (
    <html lang="en" className={fontSans.variable}>
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg focus:ring-2 focus:ring-ring">
          Skip to main content
        </a>
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-3 md:px-6 md:py-6">
          <header className="surface sticky top-3 z-30 mb-4 rounded-2xl px-4 py-3 md:mb-6 md:px-6 md:py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 lg:gap-4">
                <Link
                  href="/"
                  className="group flex min-w-0 items-center gap-3 rounded-xl outline-offset-4 transition-opacity hover:opacity-90">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-1 ring-primary/20 transition-transform group-hover:scale-[1.02]">
                    <Ticket className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="block text-base font-semibold tracking-tight text-foreground">
                      Issue Tracker
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Structured reporting for teams
                    </span>
                  </span>
                </Link>
                {session?.user?.role && (
                  <Badge
                    variant="outline"
                    className="hidden shrink-0 border-primary/25 bg-primary/5 text-xs font-medium text-primary md:inline-flex">
                    {session.user.role}
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:gap-4">
                {navItems.length > 0 && (
                  <MainNav
                    items={navItems}
                    className="justify-start sm:justify-end"
                  />
                )}
                <div className="flex items-center justify-start gap-2 sm:justify-end">
                  {session?.user && (
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
                  )}
                  {session?.user && <NotificationBell />}
                  {session?.user && (
                    <div className="group relative">
                      <Button
                        asChild
                        size="icon"
                        variant="outline"
                        className="rounded-full border-border/80"
                        aria-label="Logout">
                        <Link href="/logout">
                          <span className="sr-only">Logout</span>
                          <LogOut className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </Button>
                      <div className="pointer-events-none absolute right-0 top-11 z-40 rounded-lg border border-border/70 bg-popover/95 px-2 py-1 text-xs font-medium text-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                        Logout
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
          <main id="main-content" className="page-enter flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
