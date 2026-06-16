import { getAppSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AdminUsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAppSession();

  // Strict server-side gate: non-admin users cannot render admin users UI.
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/issues");
  }

  return <>{children}</>;
}
