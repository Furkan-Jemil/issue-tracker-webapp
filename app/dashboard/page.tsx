import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
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

  if (session.user.role !== "ADMIN") {
    return (
      <div className="page-stack">
        <Card>
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              The Dashboard is restricted to Admin users. You can continue on
              the Issues page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/issues">Go to Issues</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Dashboard"
        description="Track issue activity, status, and trends."
        icon={LayoutDashboard}
        actions={
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/issues">View all issues</Link>
          </Button>
        }
      />
      <DashboardCharts />
    </div>
  );
}
