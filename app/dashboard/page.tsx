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
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getAppSession();
  if (!session?.user) {
    redirect("/login");
  }
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="page-stack">
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
