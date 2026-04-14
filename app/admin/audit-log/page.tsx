import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";
import Link from "next/link";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import ExportDataButton from "../settings/ExportDataButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Matches `findMany` + include shape; avoids `Prisma.*` (not present until `prisma generate`). */
type AuditLogEntry = {
  id: string;
  createdAt: Date;
  eventType: string;
  description: string;
  actor: { name: string; email: string } | null;
  issue: { id: string; title: string } | null;
};

const auditLogInclude = {
  actor: { select: { name: true, email: true } },
  issue: { select: { id: true, title: true } },
};

function formatDate(d: Date | string): string {
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

export default async function AdminAuditLogPage() {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return <div className="rounded-xl border border-border/70 bg-card/80 p-4 text-sm">Admin access required.</div>;
  }
  const logs: AuditLogEntry[] = await prisma.issueHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: auditLogInclude,
  });
  const createdCount = logs.filter((log) => log.eventType === "CREATED").length;
  const statusCount = logs.filter((log) => log.eventType === "STATUS_CHANGED").length;
  const commentedCount = logs.filter((log) => log.eventType === "COMMENTED").length;

  function eventVariant(eventType: string) {
    if (eventType === "CREATED") return "secondary" as const;
    if (eventType === "STATUS_CHANGED") return "warning" as const;
    if (eventType === "COMMENTED") return "success" as const;
    return "outline" as const;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Audit Log"
        description="Review system changes, comments, and status updates."
        icon={History}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/issues" className="block">
          <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Created</p>
            <p className="mt-1 text-2xl font-semibold">{createdCount}</p>
          </CardContent>
          </Card>
        </Link>
        <Link href="/issues?view=details" className="block">
          <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Status changes</p>
            <p className="mt-1 text-2xl font-semibold">{statusCount}</p>
          </CardContent>
          </Card>
        </Link>
        <Link href="/issues?view=details&status=OPEN" className="block">
          <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Comments</p>
            <p className="mt-1 text-2xl font-semibold">{commentedCount}</p>
          </CardContent>
          </Card>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20">
          <CardTitle className="text-xl">Activity Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-border/70 bg-background/70 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Export Data</h3>
            <p className="text-sm text-muted-foreground">
              Download a full JSON export of all issues, comments, history, and notifications.
            </p>
            <ExportDataButton />
          </div>
          <div className="space-y-2 rounded-xl border border-border/70 bg-background/70 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">System Records</h3>
            <p className="text-sm text-muted-foreground">
              The audit log is the primary record for system changes, comments, and user actions.
            </p>
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link href="/issues">Go to issues</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20">
          <CardTitle className="text-xl">Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="rounded-xl border border-border/70 bg-card/40">
            <caption className="sr-only">Recent issue history events</caption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Time</TableHead>
                <TableHead scope="col">User</TableHead>
                <TableHead scope="col">Event</TableHead>
                <TableHead scope="col">Description</TableHead>
                <TableHead scope="col">Issue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="transition hover:bg-muted/30">
                  <TableCell>
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    {log.actor?.name} ({log.actor?.email})
                  </TableCell>
                  <TableCell>
                    <Badge variant={eventVariant(log.eventType)}>
                      {log.eventType}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.description}</TableCell>
                  <TableCell>
                    <Link className="text-primary hover:underline" href={log.issue ? `/issues/${log.issue.id}` : "/issues"}>
                      {log.issue?.title || "View issue"}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
