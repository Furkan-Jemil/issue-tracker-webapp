import { getAppSession } from "@/lib/auth/session";
import ExportDataButton from "./ExportDataButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function AdminSettingsPage() {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return <div className="p-8">Admin access required.</div>;
  }

  return (
    <div className="w-full px-3 py-3 md:px-4 md:py-4">
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
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
