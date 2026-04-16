import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";
import Link from "next/link";
import type { HistoryEvent } from "@prisma/client";
import {
  History,
  FilePlus2,
  RefreshCcw,
  MessageSquareText,
  ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams?: Promise<{ event?: string; q?: string }>;
}) {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return (
      <div className="rounded-xl border border-border/70 bg-card/80 p-4 text-sm">
        Admin access required.
      </div>
    );
  }
  const params = await searchParams;
  const eventFilterRaw = (params?.event || "").trim();
  const eventFilter: HistoryEvent | undefined =
    eventFilterRaw === "CREATED" ||
    eventFilterRaw === "STATUS_CHANGED" ||
    eventFilterRaw === "COMMENTED"
      ? eventFilterRaw
      : undefined;
  const query = (params?.q || "").trim();
  const where = {
    ...(eventFilter ? { eventType: eventFilter } : {}),
    ...(query
      ? {
          OR: [
            { description: { contains: query, mode: "insensitive" as const } },
            { issue: { title: { contains: query, mode: "insensitive" as const } } },
            { actor: { name: { contains: query, mode: "insensitive" as const } } },
            { actor: { email: { contains: query, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [logs, totalRecords] = await Promise.all([
    prisma.issueHistory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: auditLogInclude,
    }),
    prisma.issueHistory.count(),
  ]);
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
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/issues" className="block">
          <Card className="group cursor-pointer border-0 bg-card/75 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-card/90 focus-within:ring-2 focus-within:ring-ring/50">
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
              <div className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground/80">
                <FilePlus2 className="h-5 w-5" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/issues?view=details" className="block">
          <Card className="group cursor-pointer border-0 bg-card/75 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-card/90 focus-within:ring-2 focus-within:ring-ring/50">
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
              <div className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground/80">
                <RefreshCcw className="h-5 w-5" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/issues?view=details&status=OPEN" className="block">
          <Card className="group cursor-pointer border-0 bg-card/75 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-card/90 focus-within:ring-2 focus-within:ring-ring/50">
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
              <div className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground/80">
                <MessageSquareText className="h-5 w-5" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/20 py-3">
          <h2 className="text-xl font-semibold">Audit Log</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-md bg-muted/25 p-1">
              <Button asChild size="dense" variant={!eventFilter ? "default" : "ghost"} className="h-7 rounded-md px-2 text-xs">
                <Link href="/admin/audit-log">All</Link>
              </Button>
              <Button asChild size="dense" variant={eventFilter === "CREATED" ? "default" : "ghost"} className="h-7 rounded-md px-2 text-xs">
                <Link href="/admin/audit-log?event=CREATED">Created</Link>
              </Button>
              <Button asChild size="dense" variant={eventFilter === "STATUS_CHANGED" ? "default" : "ghost"} className="h-7 rounded-md px-2 text-xs">
                <Link href="/admin/audit-log?event=STATUS_CHANGED">Status</Link>
              </Button>
              <Button asChild size="dense" variant={eventFilter === "COMMENTED" ? "default" : "ghost"} className="h-7 rounded-md px-2 text-xs">
                <Link href="/admin/audit-log?event=COMMENTED">Comments</Link>
              </Button>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              Open issue
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <ExportDataButton compact className="shrink-0" />
            <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="System records">
              <Link href="/issues" aria-label="System records">
                <History className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
        <div>
          <Table className="bg-transparent">
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
              {logs.length > 0 ? (
                logs.map((log) => (
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No audit records match this filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">Total {totalRecords} | Filtered {logs.length}</p>
      </section>
    </div>
  );
}
