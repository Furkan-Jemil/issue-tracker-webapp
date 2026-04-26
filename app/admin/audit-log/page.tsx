import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";
import Link from "next/link";
import type { HistoryEvent } from "@prisma/client";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AutoSearchInput } from "@/components/ui/auto-search-input";
import { PageHeader } from "@/components/layout/PageHeader";
import AuditEventFilterControl from "./AuditEventFilterControl";
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
  const selectedEvent = eventFilter ?? "ALL";
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
      <section className="space-y-3">
        <div className="grid gap-2 border-b border-border/60 bg-muted/20 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <AutoSearchInput
            placeholder="Search audit log (type at least 2 letters)"
            className="w-full max-w-sm"
          />
          <div className="flex items-center gap-2">
            <AuditEventFilterControl current={selectedEvent} query={query} />
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
                <TableHead scope="col" className="hidden md:table-cell">Time</TableHead>
                <TableHead scope="col" className="hidden lg:table-cell">User</TableHead>
                <TableHead scope="col">Event</TableHead>
                <TableHead scope="col">Description</TableHead>
                <TableHead scope="col">Issue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id} className="transition hover:bg-muted/30">
                    <TableCell className="hidden md:table-cell">{formatDate(log.createdAt)}</TableCell>
                    <TableCell className="hidden lg:table-cell break-all">
                      {log.actor?.name} ({log.actor?.email})
                    </TableCell>
                    <TableCell>
                      <Badge variant={eventVariant(log.eventType)}>
                        {log.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground md:hidden">
                          {formatDate(log.createdAt)}
                        </p>
                        <p className="text-[11px] text-muted-foreground lg:hidden">
                          {log.actor?.name || "Unknown"}
                          {log.actor?.email ? ` (${log.actor.email})` : ""}
                        </p>
                        <p className="break-words">{log.description}</p>
                      </div>
                    </TableCell>
                    <TableCell className="break-words">
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
