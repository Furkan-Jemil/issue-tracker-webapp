import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";
import Link from "next/link";
import {
  History,
  FilePlus2,
  RefreshCcw,
  MessageSquareText,
  ArrowUpRight,
} from "lucide-react";
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
    return (
      <div className="rounded-xl border border-border/70 bg-card/80 p-4 text-sm">
        Admin access required.
      </div>
    );
  }
  const logs: AuditLogEntry[] = await prisma.issueHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: auditLogInclude,
  });
  const createdCount = logs.filter((log) => log.eventType === "CREATED").length;
  const statusCount = logs.filter(
    (log) => log.eventType === "STATUS_CHANGED",
  ).length;
  const commentedCount = logs.filter(
    (log) => log.eventType === "COMMENTED",
  ).length;

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
        description="Review tracked system changes, comments, and status transitions."
        icon={History}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/issues" className="block">
          <Card className="group cursor-pointer border-border/70 bg-card/95 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg focus-within:ring-2 focus-within:ring-ring/50">
            <CardContent className="flex items-center justify-between gap-3 p-3.5">
              <div>
                <p className="text-[12px] font-medium text-muted-foreground">
                  Created
                </p>
                <p className="mt-1 text-2xl font-semibold">{createdCount}</p>
                <p className="text-[11px] text-muted-foreground/80 group-hover:text-foreground">
                  View issues
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground">
                <FilePlus2 className="h-5 w-5" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/issues?view=details" className="block">
          <Card className="group cursor-pointer border-border/70 bg-card/95 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg focus-within:ring-2 focus-within:ring-ring/50">
            <CardContent className="flex items-center justify-between gap-3 p-3.5">
              <div>
                <p className="text-[12px] font-medium text-muted-foreground">
                  Status changes
                </p>
                <p className="mt-1 text-2xl font-semibold">{statusCount}</p>
                <p className="text-[11px] text-muted-foreground/80 group-hover:text-foreground">
                  Open details
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground">
                <RefreshCcw className="h-5 w-5" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/issues?view=details&status=OPEN" className="block">
          <Card className="group cursor-pointer border-border/70 bg-card/95 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg focus-within:ring-2 focus-within:ring-ring/50">
            <CardContent className="flex items-center justify-between gap-3 p-3.5">
              <div>
                <p className="text-[12px] font-medium text-muted-foreground">
                  Comments
                </p>
                <p className="mt-1 text-2xl font-semibold">{commentedCount}</p>
                <p className="text-[11px] text-muted-foreground/80 group-hover:text-foreground">
                  Open comment flow
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground">
                <MessageSquareText className="h-5 w-5" aria-hidden="true" />
              </div>
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
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Export Data
            </h3>
            <p className="text-sm text-muted-foreground">
              Download a full JSON export of all issues, comments, history, and
              notifications.
            </p>
            <ExportDataButton />
          </div>
          <div className="space-y-2 rounded-xl border border-border/70 bg-background/70 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              System Records
            </h3>
            <p className="text-sm text-muted-foreground">
              The audit log is the primary record for system changes, comments,
              and user actions.
            </p>
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link href="/issues">Go to issues</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20 py-3">
          <CardTitle className="flex items-center justify-between text-xl">
            <span>Audit Log</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              Open issue
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </CardTitle>
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
                  <TableCell>{formatDate(log.createdAt)}</TableCell>
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
                    <Link
                      className="text-primary hover:underline"
                      href={log.issue ? `/issues/${log.issue.id}` : "/issues"}>
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
