import "../styles/tailwind.css";
import NotificationBell from "@/components/notifications/NotificationBell";
import { getAppSession } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAppSession();

  const navLinkClass =
    "rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent/55 hover:text-accent-foreground";

  return (
    <html lang="en">
      <body className="antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow">
          Skip to main content
        </a>
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-3 md:px-6 md:py-6">
          <header className="surface sticky top-3 z-30 mb-4 rounded-2xl px-4 py-3 md:mb-6 md:px-6 md:py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/90 text-center text-lg font-bold leading-9 text-primary-foreground">
                  I
                </div>
                <div>
                  <p className="text-base font-semibold">Issue Tracker</p>
                  <p className="text-xs text-muted-foreground">
                    Structured reporting for users, testers, and admins
                  </p>
                </div>
                {session?.user?.role && (
                  <Badge
                    variant="secondary"
                    className="ml-1 hidden md:inline-flex">
                    {session.user.role}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <nav
                  aria-label="Primary"
                  className="flex flex-wrap items-center gap-1">
                  <Link href="/dashboard" className={navLinkClass}>
                    Dashboard
                  </Link>
                  <Link href="/issues" className={navLinkClass}>
                    Issues
                  </Link>
                  <Link href="/issues/search" className={navLinkClass}>
                    Search
                  </Link>
                  {session?.user?.role === "ADMIN" && (
                    <>
                      <Link href="/admin/users" className={navLinkClass}>
                        Admin
                      </Link>
                      <Link href="/admin/settings" className={navLinkClass}>
                        Settings
                      </Link>
                      <Link href="/admin/audit-log" className={navLinkClass}>
                        Audit Log
                      </Link>
                    </>
                  )}
                </nav>
                <div>{session?.user && <NotificationBell />}</div>
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
