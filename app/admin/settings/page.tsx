import { getAppSession } from "@/lib/auth/session";
import ExportDataButton from "./ExportDataButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminSettingsPage() {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return <div className="rounded-xl border border-border/70 bg-card/80 p-4 text-sm">Admin access required.</div>;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="System Activity"
        description="Review exports and system records without exposing settings controls."
      />
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20">
          <CardTitle className="text-xl">Activity Overview</CardTitle>
          <CardDescription>
            All content here is informational and tied to audit visibility.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-border/70 bg-background/70 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Export Data</h3>
            <p className="text-sm text-muted-foreground">
              Download a full JSON export of all issues, comments, history, and
              notifications.
            </p>
            <ExportDataButton />
          </div>
          <div className="space-y-2 rounded-xl border border-border/70 bg-background/70 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Audit Log</h3>
            <p className="text-sm text-muted-foreground">
              The audit log is the primary record for system changes, comments,
              and user actions.
            </p>
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link href="/admin/audit-log">Open Audit Log</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
