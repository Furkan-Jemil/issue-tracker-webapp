import "../styles/tailwind.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import { getAppSession } from "@/lib/auth/session";
import { AppShell, type AppNavItem } from "@/components/layout/AppShell";

const fontSans = Plus_Jakarta_Sans({
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
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg focus:ring-2 focus:ring-ring">
          Skip to main content
        </a>
        <AppShell navItems={navItems} profileName={profileName} profileEmail={profileEmail}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
