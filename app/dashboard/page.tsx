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
      <div className="mx-auto w-full max-w-2xl px-3 py-6 md:px-6 md:py-10">
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
    <div className="mx-auto w-full max-w-7xl px-3 py-4 md:px-6 md:py-8">
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dashboard</CardTitle>
          <Button asChild variant="outline">
            <Link href="/issues">View All Issues</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Monitor issue health, trends, and recent activity in one place.
          </p>
        </CardContent>
      </Card>
      <div>
        <DashboardCharts />
      </div>
    </div>
  );
}
