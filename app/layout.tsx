import "../styles/tailwind.css";
import { Manrope } from "next/font/google";
import { getAppSession } from "@/lib/auth/session";
import { AppShell, type AppNavItem } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";

const fontSans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

function buildNavItems(role: string | undefined): AppNavItem[] {
  const items: AppNavItem[] = [];
  if (role === "ADMIN") {
    items.push({ href: "/dashboard", label: "Dashboard", icon: "dashboard" });
  }
  items.push({ href: "/issues", label: "Issues", icon: "issues" });
  if (role === "ADMIN") {
    items.push(
      { href: "/admin/users", label: "Admin", icon: "admin" },
      { href: "/admin/audit-log", label: "Audit Log", icon: "audit" },
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
  const navItems = buildNavItems(session?.user?.role);

  return (
    <html lang="en" className={fontSans.variable}>
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50">
          <Button asChild size="sm" variant="outline">
            <span>Skip to main content</span>
          </Button>
        </a>
        <AppShell navItems={navItems} profileName={profileName} profileEmail={profileEmail}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
