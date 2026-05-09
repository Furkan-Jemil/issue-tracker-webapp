import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";
import Link from "next/link";
import type { HistoryEvent } from "@prisma/client";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { AuditLogToolbar } from "./AuditLogToolbar";
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
  searchParams?: Promise<{ event?: string; q?: string; page?: string }>;
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
  const pageSize = 15;
  const currentPage = Math.max(1, parseInt(params?.page || "1", 10));
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
      take: pageSize,
      skip: (currentPage - 1) * pageSize,
      include: auditLogInclude,
    }),
    prisma.issueHistory.count(),
  ]);
  const totalPages = Math.ceil(totalRecords / pageSize);
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
        <AuditLogToolbar currentEvent={selectedEvent} query={query} />
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
            <tfoot>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableCell colSpan={5} className="py-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between px-[var(--table-cell-px)]">
                    <span className="text-[11px]">Total {totalRecords} | Filtered {logs.length}</span>
                    <span>Page {currentPage} / {totalPages}</span>
                  </div>
                </TableCell>
              </TableRow>
            </tfoot>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3">
            <div />
            <div className="flex gap-2">
              <Button
                asChild
                variant="outline"
                disabled={currentPage <= 1}
              >
                <Link
                  href={currentPage > 1 ? `?page=${currentPage - 1}${eventFilter ? `&event=${eventFilter}` : ""}${query ? `&q=${query}` : ""}` : "#"}
                  aria-disabled={currentPage <= 1}
                >
                  Previous
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                disabled={currentPage >= totalPages}
              >
                <Link
                  href={currentPage < totalPages ? `?page=${currentPage + 1}${eventFilter ? `&event=${eventFilter}` : ""}${query ? `&q=${query}` : ""}` : "#"}
                  aria-disabled={currentPage >= totalPages}
                >
                  Next
                </Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
