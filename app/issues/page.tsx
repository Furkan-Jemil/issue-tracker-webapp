import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";
import {
  parseIssueStatus,
  parsePriority,
  parseSeverity,
} from "@/lib/issueFilters";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IssuesFilterPopover } from "@/app/issues/IssuesFilterPopover";
import { IssuesBoard } from "@/app/issues/IssuesBoard";
import { StatusQuickActions } from "@/app/issues/StatusQuickActions";
import { IssueSemanticBadge } from "@/components/issue/IssueSemanticBadge";
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
import { IssuesToolbar } from "@/app/issues/IssuesToolbar";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const BOARD_PAGE_SIZE = 40;

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
    createdFrom?: string;
    createdTo?: string;
    notice?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await getAppSession();
  if (!session?.user) {
    return <div className="rounded-xl border border-border/70 bg-card/80 p-4 text-sm">You must be logged in to view issues.</div>;
  }

  const isAdmin = session.user.role === "ADMIN";
  const canQuickStatus = session.user.role === "ADMIN";
  const canEditIssue = true;

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
  const createdFromRaw = params?.createdFrom?.trim() || "";
  const createdToRaw = params?.createdTo?.trim() || "";
  const createdFrom = /^\d{4}-\d{2}-\d{2}$/.test(createdFromRaw)
    ? new Date(`${createdFromRaw}T00:00:00.000Z`)
    : null;
  const createdTo = /^\d{4}-\d{2}-\d{2}$/.test(createdToRaw)
    ? new Date(`${createdToRaw}T23:59:59.999Z`)
    : null;
  const notice = params?.notice || "";
  const skip = (currentPage - 1) * pageSize;

  const baseWhere = {
    ...(!isAdmin ? { createdBy: session.user.id } : {}),
  };

  const where = {
    ...baseWhere,
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
    ...(createdFrom || createdTo
      ? {
          createdAt: {
            ...(createdFrom ? { gte: createdFrom } : {}),
            ...(createdTo ? { lte: createdTo } : {}),
          },
        }
      : {}),
  };

  const [issues, filteredTotal, totalVisible, reporters] = await Promise.all([
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
    prisma.issue.count({ where: baseWhere }),
    isAdmin
      ? prisma.user.findMany({
          select: { id: true, name: true, email: true, role: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const reporterById = new Map(
    reporters.map((user) => [user.id, user]),
  );
  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const hasActiveFilterFields = Boolean(
    status || priority || severity || reporter || assignee || createdFrom || createdTo,
  );
  const showActionsColumn = canQuickStatus || issues.some((issue) => canEditIssue && (isAdmin || issue.status === "OPEN"));
  const activeFilterCount = [
    status,
    priority,
    severity,
    reporter,
    assignee,
    createdFromRaw,
    createdToRaw,
  ].filter(Boolean).length;
  const tableColumnCount =
    5 + (showActionsColumn ? 1 : 0) + (showDetails ? 2 : 0) + (isAdmin && showDetails ? 2 : 0);
  const issuesTableCaption = `Showing page ${currentPage} of ${totalPages} (${filteredTotal} filtered issues), ${view} view`;
  const cellPaddingClass = showDetails ? "py-1.5" : "py-1";
  const headPaddingClass = showDetails ? "h-8 py-0.5" : "h-8 py-0.5";
  const boardIssues = issues.map((issue) => ({
    ...issue,
    status: issue.status as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED",
    createdAt: issue.createdAt.toISOString(),
  }));

  const assigneeLabelById = Object.fromEntries(
    reporters.map((user) => [user.id, user.name || user.email]),
  );

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
    if (createdFromRaw) nextParams.set("createdFrom", createdFromRaw);
    if (createdToRaw) nextParams.set("createdTo", createdToRaw);
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
    if (query) nextParams.set("q", query);
    return `/issues?${nextParams.toString()}`;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Issues"
        description="Track, prioritize, and move issues through the workflow."
      />
      <section className="space-y-3">
        <IssuesToolbar
          view={view}
          isAdmin={isAdmin}
          hasActiveFilters={hasActiveFilterFields}
          activeFilterCount={activeFilterCount}
          query={query}
          createdFrom={createdFromRaw}
          createdTo={createdToRaw}
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
            <IssuesBoard
              issues={boardIssues}
              assigneeLabelById={assigneeLabelById}
              canManageStatus={canQuickStatus}
              canEditIssue={canEditIssue}
              canEditAllIssues={isAdmin}
            />
          ) : (
            <Table className="bg-transparent">
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
                  {showActionsColumn ? (
                    <TableHead scope="col" className={cn(headPaddingClass, "text-right")}>Action</TableHead>
                  ) : null}
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
                  issues.map((issue) => {
                    const canEditThisIssue = canEditIssue && (isAdmin || issue.status === "OPEN");
                    const canShowActions = canQuickStatus || canEditThisIssue;

                    return (
                    <TableRow key={issue.id} className="transition hover:bg-muted/20">
                      <TableCell className={cellPaddingClass}>
                        <Link
                          href={`/issues/${issue.id}`}
                          className="break-words text-[14px] font-medium text-primary hover:underline">
                          {issue.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground lg:hidden">
                          <IssueSemanticBadge kind="status" value={issue.status} className="px-2.5 py-1 text-[11px]" />
                          <IssueSemanticBadge kind="priority" value={issue.priority} className="px-2.5 py-1 text-[11px]" />
                          <IssueSemanticBadge kind="type" value={issue.type} className="px-2.5 py-1 text-[11px]" />
                          <IssueSemanticBadge kind="severity" value={issue.severity} className="px-2.5 py-1 text-[11px]" />
                        </div>
                      </TableCell>
                      <TableCell className={cn(cellPaddingClass, "hidden lg:table-cell")}>
                        <IssueSemanticBadge kind="type" value={issue.type} className="px-2.5 py-1 text-[11px]" />
                      </TableCell>
                      <TableCell className={cellPaddingClass}>
                        <IssueSemanticBadge kind="priority" value={issue.priority} className="px-2.5 py-1 text-[11px]" />
                      </TableCell>
                      <TableCell className={cn(cellPaddingClass, "hidden xl:table-cell")}>
                        <IssueSemanticBadge kind="severity" value={issue.severity} className="px-2.5 py-1 text-[11px]" />
                      </TableCell>
                      <TableCell className={cellPaddingClass}>
                        <div className="flex flex-wrap items-center gap-1">
                          <IssueSemanticBadge kind="status" value={issue.status} className="px-2.5 py-1 text-[11px]" />
                        </div>
                      </TableCell>
                      {showActionsColumn ? (
                        <TableCell className={cn(cellPaddingClass, "text-right")}>
                          {canShowActions ? (
                            <div className="flex justify-end">
                              <StatusQuickActions
                                issueId={issue.id}
                                currentStatus={issue.status}
                                editHref={`/issues/${issue.id}#edit-section`}
                                allowStatusChange={canQuickStatus}
                                allowEdit={canEditThisIssue}
                              />
                            </div>
                          ) : null}
                        </TableCell>
                      ) : null}
                      {isAdmin && showDetails && (
                        <TableCell className={cellPaddingClass}>
                          {issue.assigneeId ? (
                            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                              <span className="break-words text-[13px]">{getUserLabel(issue.assigneeId, "Unknown assignee")}</span>
                              {getUserRoleChip(reporterById.get(issue.assigneeId)?.role)}
                            </div>
                          ) : (
                            "Unassigned"
                          )}
                        </TableCell>
                      )}
                      {isAdmin && showDetails && (
                        <TableCell className={cellPaddingClass}>
                          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            <span className="break-words text-[13px]">{getUserLabel(issue.createdBy, "Unknown reporter")}</span>
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
                    );
                  })
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
              <tfoot>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableCell colSpan={tableColumnCount} className="py-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between px-[var(--table-cell-px)]">
                      <span>Page {currentPage} / {totalPages}</span>
                      <span className="text-[11px]">{filteredTotal} filtered issues</span>
                    </div>
                  </TableCell>
                </TableRow>
              </tfoot>
            </Table>
          )}
          <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-muted-foreground">
              Total {totalVisible} | Filtered {filteredTotal}
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
      </section>
    </div>
  );
}
