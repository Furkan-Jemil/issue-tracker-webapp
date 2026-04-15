import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";
import {
  parseIssueStatus,
  parsePriority,
  parseSeverity,
} from "@/lib/issueFilters";
import Link from "next/link";
import { ClipboardList, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IssuesFilterPopover } from "@/app/issues/IssuesFilterPopover";
import { StatusQuickActions } from "@/app/issues/StatusQuickActions";
import { IssueViewPresets } from "@/components/issue/IssueViewPresets";
import { IssueSemanticBadge } from "@/components/issue/IssueSemanticBadge";
import { DesignReferenceGallery } from "@/components/layout/DesignReferenceGallery";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const BOARD_PAGE_SIZE = 40;
const BOARD_STATUS_ORDER = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

function statusVariant(status: string) {
  if (status === "OPEN") return "warning" as const;
  if (status === "IN_PROGRESS") return "secondary" as const;
  if (status === "RESOLVED") return "success" as const;
  return "outline" as const;
}

function formatDate(d: Date | string): string {
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

export default async function IssuesListPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string;
    view?: string;
    details?: string;
    q?: string;
    status?: string;
    priority?: string;
    severity?: string;
    reporter?: string;
    assignee?: string;
    notice?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await getAppSession();
  if (!session?.user) {
    return <div className="rounded-xl border border-border/70 bg-card/80 p-4 text-sm">You must be logged in to view issues.</div>;
  }

  const isAdmin = session.user.role === "ADMIN";
  const canQuickStatus =
    session.user.role === "ADMIN" || session.user.role === "TESTER";

  const view =
    params?.view === "board"
      ? "board"
      : params?.view === "details"
        ? "details"
        : "compact";
  const isBoard = view === "board";
  const currentPage = Math.max(1, Number(params?.page || "1") || 1);
  const pageSize = isBoard ? BOARD_PAGE_SIZE : PAGE_SIZE;
  const showDetails = view === "details";
  const query = params?.q?.trim() || "";
  const status = isAdmin ? parseIssueStatus(params?.status) || "" : "";
  const priority = isAdmin ? parsePriority(params?.priority) || "" : "";
  const severity = isAdmin ? parseSeverity(params?.severity) || "" : "";
  const reporter =
    isAdmin && typeof params?.reporter === "string"
      ? params.reporter.trim()
      : "";
  const assignee =
    isAdmin && typeof params?.assignee === "string"
      ? params.assignee.trim()
      : "";
  const notice = params?.notice || "";
  const skip = (currentPage - 1) * pageSize;

  const where = {
    ...(isAdmin && reporter ? { createdBy: reporter } : {}),
    ...(isAdmin && assignee ? { assigneeId: assignee } : {}),
    ...(query
      ? {
          title: { contains: query, mode: "insensitive" as const },
        }
      : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(severity ? { severity } : {}),
  };

  const [issues, total, reporters, statusCounts] = await Promise.all([
    prisma.issue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        type: true,
        priority: true,
        severity: true,
        status: true,
        createdAt: true,
        reportedAt: true,
        createdBy: true,
        assigneeId: true,
      },
    }),
    prisma.issue.count({ where }),
    isAdmin
      ? prisma.user.findMany({
          select: { id: true, name: true, email: true, role: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    prisma.issue.groupBy({
      by: ["status"],
      where,
      _count: { status: true },
    }),
  ]);

  const reporterById = new Map(
    reporters.map((user) => [user.id, user]),
  );
  const statusCountMap = new Map(
    statusCounts.map((entry) => [entry.status, entry._count.status]),
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const hasActiveFilters = Boolean(
    query || status || priority || severity || reporter || assignee,
  );
  const tableColumnCount =
    5 + (showDetails ? 2 : 0) + (isAdmin && showDetails ? 2 : 0);
  const issuesTableCaption = `Showing page ${currentPage} of ${totalPages} (${total} total issues), ${view} view`;
  const cellPaddingClass = showDetails ? "py-2.5" : "py-1.5";
  const headPaddingClass = showDetails ? "h-10 py-1.5" : "h-9 py-1";
  const boardColumns = BOARD_STATUS_ORDER.map((statusKey) => ({
    key: statusKey,
    label:
      statusKey === "OPEN"
        ? "Open"
        : statusKey === "IN_PROGRESS"
          ? "In Progress"
          : statusKey === "RESOLVED"
            ? "Resolved"
            : "Closed",
      total: statusCountMap.get(statusKey) ?? 0,
    issues: issues.filter((issue) => issue.status === statusKey),
  }));

  const statusFilterOptions = BOARD_STATUS_ORDER.map((statusKey) => ({
    key: statusKey,
    label:
      statusKey === "OPEN"
        ? "Open"
        : statusKey === "IN_PROGRESS"
          ? "In progress"
          : statusKey === "RESOLVED"
            ? "Resolved"
            : "Closed",
    count: statusCountMap.get(statusKey) ?? 0,
  }));

  function getUserLabel(userId: string, fallback: string) {
    const user = reporterById.get(userId);
    return user ? user.name || user.email : fallback;
  }

  function getUserRoleChip(role?: string | null) {
    if (!role) return null;
    const label = role === "TESTER" ? "Tester" : role === "ADMIN" ? "Admin" : "User";
    return (
      <Badge variant="outline" className="ml-2 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide">
        {label}
      </Badge>
    );
  }

  function appendToolbarParams(nextParams: URLSearchParams) {
    if (query) nextParams.set("q", query);
    if (status) nextParams.set("status", status);
    if (priority) nextParams.set("priority", priority);
    if (severity) nextParams.set("severity", severity);
    if (reporter) nextParams.set("reporter", reporter);
    if (assignee) nextParams.set("assignee", assignee);
  }

  function buildIssuesHref(page: number) {
    const nextParams = new URLSearchParams({
      page: String(page),
      view,
    });
    appendToolbarParams(nextParams);
    return `/issues?${nextParams.toString()}`;
  }

  function buildDismissNoticeHref() {
    const nextParams = new URLSearchParams({
      page: String(currentPage),
      view,
    });
    appendToolbarParams(nextParams);
    return `/issues?${nextParams.toString()}`;
  }

  function buildClearFiltersHref() {
    const nextParams = new URLSearchParams({ view, page: "1" });
    return `/issues?${nextParams.toString()}`;
  }

  function buildViewHref(nextView: "compact" | "details" | "board") {
    const nextParams = new URLSearchParams({ view: nextView, page: "1" });
    appendToolbarParams(nextParams);
    return `/issues?${nextParams.toString()}`;
  }

  function buildStatusHref(nextStatus: (typeof BOARD_STATUS_ORDER)[number]) {
    const nextParams = new URLSearchParams({ view, page: "1", status: nextStatus });
    if (query) nextParams.set("q", query);
    if (priority) nextParams.set("priority", priority);
    if (severity) nextParams.set("severity", severity);
    if (reporter) nextParams.set("reporter", reporter);
    if (assignee) nextParams.set("assignee", assignee);
    return `/issues?${nextParams.toString()}`;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Issues"
        description="Track, prioritize, and move issues through the workflow."
        icon={ClipboardList}
        actions={
          <>
            <div className="flex flex-wrap items-center gap-1 rounded-full border border-border/70 bg-background/80 p-1 shadow-sm">
              {[
                { label: "Compact", href: buildViewHref("compact"), active: view === "compact" },
                { label: "Detailed", href: buildViewHref("details"), active: view === "details" },
                { label: "Board", href: buildViewHref("board"), active: view === "board" },
              ].map((item) => (
                <Button
                  key={item.label}
                  asChild
                  size="dense"
                  variant={item.active ? "default" : "ghost"}
                  className="rounded-full px-3 font-medium"
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </div>
            <IssuesFilterPopover
              view={view}
              isAdmin={isAdmin}
              hasActiveFilters={hasActiveFilters}
              query={query}
              status={status}
              priority={priority}
              severity={severity}
              reporter={reporter}
              assignee={assignee}
              reporters={reporters.map((user) => ({
                id: user.id,
                label: user.name || user.email,
                role: user.role,
              }))}
              onSubmitHref="/issues"
              onResetHref={buildClearFiltersHref()}
            />
            <Button asChild>
              <Link href="/issues/new">Create Issue</Link>
            </Button>
          </>
        }
      />
      <DesignReferenceGallery />
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/80 px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground/90">View modes</span>
          <div className="group relative inline-flex items-center">
            <button
              type="button"
              aria-label="How issue views work"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="pointer-events-none absolute left-1/2 top-9 z-20 w-max max-w-[240px] -translate-x-1/2 rounded-lg border border-border/70 bg-popover px-3 py-2 text-[11px] text-popover-foreground opacity-0 shadow-lg transition group-hover:opacity-100">
              Compact is for fast scanning, Detailed is for ownership context, and Board is for triage by status.
            </div>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">Hover the icon for help</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: "Filtered", value: total, href: buildClearFiltersHref() },
          ...statusFilterOptions.map((item) => ({
            label: item.label,
            value: item.count,
            href: buildStatusHref(item.key),
          })),
        ].map((item) => (
          <Link key={item.label} href={item.href} className="group rounded-2xl border border-border/70 bg-card/80 px-3 py-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-md">
            <div className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">{item.label}</div>
            <div className="mt-1 text-lg font-semibold text-foreground">{item.value}</div>
          </Link>
        ))}
      </div>
      <IssueViewPresets />
      <Card className="overflow-hidden">
        <CardContent className="space-y-4 p-4 md:p-5">
          {notice === "admin-dashboard-only" && (
            <Card className="border-amber-300 bg-amber-50/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Dashboard access is admin-only</CardTitle>
                <CardDescription className="text-amber-900/80">
                  You were redirected to Issues.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button asChild variant="outline" size="sm">
                  <Link href={buildDismissNoticeHref()}>Close</Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {isBoard ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                Board view groups the current filtered page by status so handoff and triage stay simple.
              </div>
              <div className="grid gap-3 xl:grid-cols-4">
                {boardColumns.map((column) => (
                  <section key={column.key} className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-semibold text-foreground">{column.label}</h2>
                        <p className="text-xs text-muted-foreground">{column.total} filtered issues</p>
                      </div>
                      <Badge variant={statusVariant(column.key)}>{column.key}</Badge>
                    </div>
                    <div className="space-y-2">
                      {column.issues.length > 0 ? (
                        column.issues.map((issue) => (
                          <Card key={issue.id} density="dense" className="border-border/70 bg-card/95">
                            <CardContent className="space-y-2 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <IssueSemanticBadge kind="status" value={issue.status} />
                                    <IssueSemanticBadge kind="priority" value={issue.priority} />
                                  </div>
                                  <Link href={`/issues/${issue.id}`} className="font-semibold leading-snug text-primary hover:underline">
                                    {issue.title}
                                  </Link>
                                </div>
                                {canQuickStatus && (
                                  <StatusQuickActions
                                    issueId={issue.id}
                                    currentStatus={issue.status}
                                  />
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                                <IssueSemanticBadge kind="type" value={issue.type} />
                                <IssueSemanticBadge kind="severity" value={issue.severity} />
                                <span className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px]">
                                  Assignee: {issue.assigneeId ? getUserLabel(issue.assigneeId, "Unknown") : "Unassigned"}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">Created {formatDate(issue.createdAt)}</p>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                          No issues in this lane for the current filters.
                        </div>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : (
            <Table className="rounded-xl border border-border/70 bg-card/40">
              <caption className="sr-only">{issuesTableCaption}</caption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className={headPaddingClass}>
                    Title
                  </TableHead>
                  <TableHead scope="col" className={cn(headPaddingClass, "hidden lg:table-cell")}>
                    Type
                  </TableHead>
                  <TableHead scope="col" className={headPaddingClass}>
                    Priority
                  </TableHead>
                  <TableHead scope="col" className={cn(headPaddingClass, "hidden xl:table-cell")}>
                    Severity
                  </TableHead>
                  <TableHead scope="col" className={headPaddingClass}>
                    Status
                  </TableHead>
                  {isAdmin && showDetails && (
                    <TableHead scope="col" className={headPaddingClass}>
                      Assignee
                    </TableHead>
                  )}
                  {isAdmin && showDetails && (
                    <TableHead scope="col" className={headPaddingClass}>
                      Reporter
                    </TableHead>
                  )}
                  {showDetails && (
                    <TableHead scope="col" className={headPaddingClass}>
                      Reported
                    </TableHead>
                  )}
                  {showDetails && (
                    <TableHead scope="col" className={headPaddingClass}>
                      Created
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.length > 0 ? (
                  issues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell className={cellPaddingClass}>
                        <Link
                          href={`/issues/${issue.id}`}
                          className="font-medium text-primary hover:underline">
                          {issue.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground lg:hidden">
                          <IssueSemanticBadge kind="status" value={issue.status} />
                          <IssueSemanticBadge kind="priority" value={issue.priority} />
                          <IssueSemanticBadge kind="type" value={issue.type} />
                          <IssueSemanticBadge kind="severity" value={issue.severity} />
                        </div>
                      </TableCell>
                      <TableCell className={cn(cellPaddingClass, "hidden lg:table-cell")}>
                        <IssueSemanticBadge kind="type" value={issue.type} />
                      </TableCell>
                      <TableCell className={cellPaddingClass}>
                        <IssueSemanticBadge kind="priority" value={issue.priority} />
                      </TableCell>
                      <TableCell className={cn(cellPaddingClass, "hidden xl:table-cell")}>
                        <IssueSemanticBadge kind="severity" value={issue.severity} />
                      </TableCell>
                      <TableCell className={cellPaddingClass}>
                        <div className="flex items-center gap-1.5">
                          <IssueSemanticBadge kind="status" value={issue.status} />
                          {canQuickStatus && (
                            <StatusQuickActions
                              issueId={issue.id}
                              currentStatus={issue.status}
                            />
                          )}
                        </div>
                      </TableCell>
                      {isAdmin && showDetails && (
                        <TableCell className={cellPaddingClass}>
                          {issue.assigneeId ? (
                            <div className="flex items-center gap-2">
                              <span>{getUserLabel(issue.assigneeId, "Unknown assignee")}</span>
                              {getUserRoleChip(reporterById.get(issue.assigneeId)?.role)}
                            </div>
                          ) : (
                            "Unassigned"
                          )}
                        </TableCell>
                      )}
                      {isAdmin && showDetails && (
                        <TableCell className={cellPaddingClass}>
                          <div className="flex items-center gap-2">
                            <span>{getUserLabel(issue.createdBy, "Unknown reporter")}</span>
                            {getUserRoleChip(reporterById.get(issue.createdBy)?.role)}
                          </div>
                        </TableCell>
                      )}
                      {showDetails && (
                        <TableCell className={cellPaddingClass}>
                          {issue.reportedAt ? formatDate(issue.reportedAt) : "-"}
                        </TableCell>
                      )}
                      {showDetails && (
                        <TableCell className={cellPaddingClass}>
                          {formatDate(issue.createdAt)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={tableColumnCount} className="py-10">
                      <div className="mx-auto max-w-md rounded-xl border border-dashed border-border/70 bg-background/80 px-4 py-5 text-center">
                        <p className="text-sm font-medium text-foreground">No issues match this view</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Clear filters or create a new issue to get started.
                        </p>
                        <div className="mt-3 flex justify-center gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={buildClearFiltersHref()}>Clear filters</Link>
                          </Button>
                          <Button asChild size="sm">
                            <Link href="/issues/new">Create issue</Link>
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>
              Page {currentPage} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" disabled={!hasPrev}>
                <Link
                  href={hasPrev ? buildIssuesHref(currentPage - 1) : "#"}
                  aria-disabled={!hasPrev}>
                  Previous
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" disabled={!hasNext}>
                <Link
                  href={hasNext ? buildIssuesHref(currentPage + 1) : "#"}
                  aria-disabled={!hasNext}>
                  Next
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
