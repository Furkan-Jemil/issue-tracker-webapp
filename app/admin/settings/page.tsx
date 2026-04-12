import { getAppSession } from "@/lib/auth/session";
import ExportDataButton from "./ExportDataButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function AdminSettingsPage() {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return <div className="rounded-xl border border-border/70 bg-card/80 p-4 text-sm">Admin access required.</div>;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="System Settings"
        description="Manage system configuration and export data."
      />
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20">
          <CardTitle className="text-xl">System Settings</CardTitle>
          <CardDescription>
            Manage system configuration and export data.
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
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Data Scope</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>Includes issues, comments, and activity logs</li>
              <li>Includes notifications for auditability</li>
              <li>Exported as JSON for BI and backup usage</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
