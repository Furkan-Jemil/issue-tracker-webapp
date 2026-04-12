import { getAppSession } from "@/lib/auth/session";
import ExportDataButton from "./ExportDataButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function AdminSettingsPage() {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return <div className="rounded-xl border border-border/70 bg-card/80 p-4 text-sm">Admin access required.</div>;
  }

  return (
    <div className="page-stack">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">System Settings</CardTitle>
          <CardDescription>
            Manage system configuration and export data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Export Data</h3>
            <p className="text-sm text-muted-foreground">
              Download a full JSON export of all issues, comments, history, and
              notifications.
            </p>
            <ExportDataButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
