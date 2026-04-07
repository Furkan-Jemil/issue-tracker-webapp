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

  if (session.user.role !== "ADMIN") {
    return (
      <div className="w-full px-3 py-3 md:px-4 md:py-4">
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
    <div className="w-full px-3 py-3 md:px-4 md:py-4">
      <div className="mb-4 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Dashboard
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          Monitor volume, status mix, and recent activity across the workspace.
        </p>
      </div>
      <Card className="mb-4 border-border/80 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-border/60 bg-muted/25 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Overview</CardTitle>
            <CardDescription>
              High-level metrics for the last 30 days. Open the full queue
              anytime.
            </CardDescription>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/issues">View all issues</Link>
          </Button>
        </CardHeader>
      </Card>
      <div>
        <DashboardCharts />
      </div>
    </div>
  );
}
