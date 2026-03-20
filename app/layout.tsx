import "../styles/tailwind.css";
import NotificationBell from "@/components/notifications/NotificationBell";
import { getServerSession } from "next-auth";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  return (
    <html lang="en">
      <body>
        <header className="w-full flex items-center justify-between p-4 border-b">
          <nav className="flex gap-4 items-center">
            <a
              href="/dashboard"
              className="font-semibold text-blue-700 hover:underline">
              Dashboard
            </a>
            <a
              href="/issues"
              className="font-semibold text-blue-700 hover:underline">
              Issues
            </a>
            <a
              href="/issues/search"
              className="font-semibold text-blue-700 hover:underline">
              Search
            </a>
            {session?.user?.role === "ADMIN" && (
              <>
                <a
                  href="/admin/users"
                  className="font-semibold text-red-700 hover:underline">
                  Admin
                </a>
                <a
                  href="/admin/settings"
                  className="font-semibold text-red-700 hover:underline ml-2">
                  Settings
                </a>
                <a
                  href="/admin/audit-log"
                  className="font-semibold text-red-700 hover:underline ml-2">
                  Audit Log
                </a>
              </>
            )}
          </nav>
          <div>
            {session?.user && <NotificationBell userId={session.user.id} />}
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
