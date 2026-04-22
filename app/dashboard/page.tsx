import Link from "next/link";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import { getAppSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getAppSession();
  if (!session?.user) {
    redirect("/login");
  }
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="page-stack">
      <PageHeader
        title="Dashboard"
        description={
          isAdmin
            ? "Track issue activity, status, and trends across the full workspace."
            : "Track issue activity, status, and trends for your own issues."
        }
      />
      {!isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Personal Workspace View</CardTitle>
            <CardDescription>
              This dashboard only includes issues you created. Admin dashboards
              include full workspace data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/issues">Open My Issues</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <DashboardCharts />
    </div>
  );
}
