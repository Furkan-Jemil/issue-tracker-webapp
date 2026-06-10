import Link from "next/link";
import DashboardCharts from "@/app/(main)/dashboard/dashboard-charts";
import { getAppSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
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
            ? "Track task activity, status, and trends across the full workspace."
            : "Track task activity, status, and trends for your own tasks."
        }
      />
      {!isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Personal Workspace View</CardTitle>
            <CardDescription>
              This dashboard only includes tasks you created. Admin dashboards
              include full workspace data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/tasks">Open My Tasks</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <DashboardCharts />
    </div>
  );
}
