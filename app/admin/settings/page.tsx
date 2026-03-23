import prisma from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { getAppSession } from "@/lib/auth/session";
import ExportDataButton from "./ExportDataButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export default async function AdminSettingsPage() {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return <div className="p-8">Admin access required.</div>;
  }
  // Example: fetch settings (stub, extend as needed)
  // const settings = await prisma.setting.findMany();
  return (
    <div className="mx-auto w-full max-w-3xl px-3 py-4 md:px-6 md:py-8">
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="system-name">System Name</Label>
              <Input
                id="system-name"
                type="text"
                placeholder="Issue Tracker"
                defaultValue="Issue Tracker"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="logo-url">Logo URL</Label>
              <Input id="logo-url" type="text" placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="registration-domains">
                Allowed Registration Domains
              </Label>
              <Input
                id="registration-domains"
                type="text"
                placeholder="example.com, company.org"
              />
              <div className="text-xs text-muted-foreground">
                Comma-separated. Leave blank to allow all.
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="allow-registration">
                Allow New User Registration
              </Label>
              <Select id="allow-registration" className="max-w-40">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Export Data</Label>
              <ExportDataButton />
            </div>
            <Button type="submit">Save Settings</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
