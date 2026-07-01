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
import { IssuesFilterPopover } from "@/app/(main)/tasks/tasks-table-filter";
import { StatusQuickActions } from "@/app/(main)/tasks/tasks-table-row-actions";
import { IssueSemanticBadge } from "@/app/(main)/tasks/task-semantic-badge";
import { SearchInput } from "@/components/layout/search-input";
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
import { cn, formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { getPaginationMeta, getTotalPages } from "@/lib/pagination";

export default async function IssuesListPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string;
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

  const currentPage = Math.max(1, Number(params?.page || "1") || 1);
  const pageSize = DEFAULT_PAGE_SIZE;
  const query = params?.q?.trim() || "";
  const status = isAdmin ? parseIssueStatus(params?.status) || "" : "";
  const priority = isAdmin ? parsePriority(params?.priority) || "" : "";
  const severity = isAdmin ? parseSeverity(params?.severity) || "" : "";
  const reporter = isAdmin && typeof params?.reporter === "string" ? params.reporter.trim() : "";
  const assignee = isAdmin && typeof params?.assignee === "string" ? params.assignee.trim() : "";
  const createdFromRaw = params?.createdFrom?.trim() || "";
  const createdToRaw = params?.createdTo?.trim() || "";
  const createdFrom = /^\d{4}-\d{2}-\d{2}$/.test(createdFromRaw)
    ? new Date(`${createdFromRaw}T00:00:00.000Z`) : null;
  const createdTo = /^\d{4}-\d{2}-\d{2}$/.test(createdToRaw)
    ? new Date(`${createdToRaw}T23:59:59.999Z`) : null;
  const notice = params?.notice || "";
  const skip = (currentPage - 1) * pageSize;

  const baseWhere = { ...(!isAdmin ? { createdBy: session.user.id } : {}) };

  const where = {
    ...baseWhere,
    ...(isAdmin && reporter ? { createdBy: reporter } : {}),
    ...(isAdmin && assignee ? { assigneeId: assignee } : {}),
    ...(query ? { title: { contains: query, mode: "insensitive" as const } } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(severity ? { severity } : {}),
    ...(createdFrom || createdTo ? {
      createdAt: {
        ...(createdFrom ? { gte: createdFrom } : {}),
        ...(createdTo ? { lte: createdTo } : {}),
      },
    } : {}),
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

  const reporterById = new Map(reporters.map((u) => [u.id, u]));
  const { totalPages, hasPrev, hasNext } = getPaginationMeta(filteredTotal, pageSize, currentPage);

  const hasActiveFilterFields = Boolean(
    status || priority || severity || reporter || assignee || createdFrom || createdTo,
  );
  const showActionsColumn = canQuickStatus || issues.some(
    (issue) => canEditIssue && (isAdmin || issue.status === "OPEN"),
  );
  const activeFilterCount = [status, priority, severity, reporter, assignee, createdFromRaw, createdToRaw]
    .filter(Boolean).length;
  const tableColumnCount = 5 + (showActionsColumn ? 1 : 0);
  const issuesTableCaption = `Showing page ${currentPage} of ${getTotalPages(filteredTotal, pageSize)} (${filteredTotal} issues)`;

  const detailHintByKind = {
    type: "What kind of work it is",
    priority: "When this needs attention",
    severity: "How much this impacts users",
    status: "Where it is in the workflow",
  } as const;

  function getUserLabel(userId: string, fallback: string) {
    const user = reporterById.get(userId);
    return user ? user.name || user.email : fallback;
  }

  function getUserRoleChip(role?: string | null) {
    if (!role) return null;
    const label = role === "TESTER" ? "Tester" : role === "ADMIN" ? "Admin" : "User";
    return (
      <Badge variant="outline" className="ml-1.5 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide">
        {label}
      </Badge>
    );
  }

  function buildIssuesHref(page: number) {
    const p = new URLSearchParams({ page: String(page) });
    if (query) p.set("q", query);
    if (status) p.set("status", status);
    if (priority) p.set("priority", priority);
    if (severity) p.set("severity", severity);
    if (reporter) p.set("reporter", reporter);
    if (assignee) p.set("assignee", assignee);
    if (createdFromRaw) p.set("createdFrom", createdFromRaw);
    if (createdToRaw) p.set("createdTo", createdToRaw);
    return `/tasks?${p.toString()}`;
  }

  function buildClearFiltersHref() {
    const p = new URLSearchParams({ page: "1" });
    if (query) p.set("q", query);
    return `/tasks?${p.toString()}`;
  }

  return (
    <div className="flex h-[calc(100vh-var(--space-main-top,0.45rem)-5rem)] flex-col gap-0">

      {/* ── Sticky toolbar ───────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center gap-2 border-b border-border/60 bg-background/95 px-1 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {/* Left: title + count pill */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="text-sm font-semibold text-foreground">Issues</h1>
          <span className="rounded-full border border-border/60 bg-muted/60 px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            {hasActiveFilterFields ? `${filteredTotal} of ${totalVisible}` : `${totalVisible} total`}
          </span>
        </div>

        {/* Right: search + filter + create */}
        <div className="flex items-center gap-1.5">
          <SearchInput
            placeholder="Search issues…"
            className="w-[180px] sm:w-[220px]"
          />
          <IssuesFilterPopover
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
            reporters={reporters.map((u) => ({ id: u.id, label: u.name || u.email, role: u.role }))}
            onSubmitHref="/tasks"
            onResetHref={buildClearFiltersHref()}
          />
          <Button asChild size="sm" className="h-9 gap-1.5 rounded-lg px-3 text-xs font-semibold">
            <Link href="/tasks/new">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Create Issue</span>
              <span className="sm:hidden">New</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Notice banner ──────────────────────────────────────────────────── */}
      {notice === "admin-dashboard-only" && (
        <div className="shrink-0 px-1 pt-2">
          <Card className="border-amber-300 bg-amber-50/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Dashboard access is admin-only</CardTitle>
              <CardDescription className="text-amber-900/80">You were redirected to Issues.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild variant="outline" size="sm">
                <Link href="/tasks">Dismiss</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Scrollable table ───────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="min-w-[640px]">
          <Table>
            <caption className="sr-only">{issuesTableCaption}</caption>
            <TableHeader className="sticky top-0 z-[5] bg-muted/80 backdrop-blur">
              <TableRow>
                <TableHead scope="col" className="sticky left-0 z-[6] bg-muted/80 backdrop-blur h-9 py-0 pl-3 after:pointer-events-none after:absolute after:inset-y-0 after:-right-3 after:w-3 after:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.15)]">Title</TableHead>
                <TableHead scope="col" className="h-9 py-0 hidden lg:table-cell">Type</TableHead>
                <TableHead scope="col" className="h-9 py-0">Priority</TableHead>
                <TableHead scope="col" className="h-9 py-0 hidden xl:table-cell">Severity</TableHead>
                <TableHead scope="col" className="h-9 py-0">Status</TableHead>
                {showActionsColumn && (
                  <TableHead scope="col" className="h-9 py-0 text-right pr-3">Action</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.length > 0 ? (
                issues.map((issue) => {
                  const canEditThisIssue = canEditIssue && (isAdmin || issue.status === "OPEN");
                  const canShowActions = canQuickStatus || canEditThisIssue;

                  return (
                    <TableRow
                      key={issue.id}
                      className="group cursor-pointer transition-colors hover:bg-muted/40 focus-within:bg-muted/30 focus-visible:ring-1 focus-visible:ring-primary/30">
                      <TableCell className="sticky left-0 z-[3] bg-background group-hover:bg-muted/40 py-2.5 pl-3 after:pointer-events-none after:absolute after:inset-y-0 after:-right-3 after:w-3 after:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.15)]">
                        <Link
                          href={`/tasks/${issue.id}`}
                          className="block break-words text-[13px] font-medium text-primary hover:underline">
                          {issue.title}
                        </Link>
                        {/* Mobile badges below title */}
                        <div className="mt-1 flex flex-wrap items-center gap-1 lg:hidden">
                          <IssueSemanticBadge kind="status" value={issue.status} className="px-2 py-0.5 text-[10px]" />
                          <IssueSemanticBadge kind="priority" value={issue.priority} className="px-2 py-0.5 text-[10px]" />
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground xl:hidden">
                          {formatDate(issue.createdAt)}
                        </p>
                      </TableCell>
                      <TableCell className="py-2.5 hidden lg:table-cell">
                        <IssueSemanticBadge kind="type" value={issue.type} className="px-2 py-0.5 text-[11px]" />
                      </TableCell>
                      <TableCell className="py-2.5">
                        <IssueSemanticBadge kind="priority" value={issue.priority} className="px-2 py-0.5 text-[11px]" title={detailHintByKind.priority} />
                      </TableCell>
                      <TableCell className="py-2.5 hidden xl:table-cell">
                        <IssueSemanticBadge kind="severity" value={issue.severity} className="px-2 py-0.5 text-[11px]" title={detailHintByKind.severity} />
                      </TableCell>
                      <TableCell className="py-2.5">
                        <IssueSemanticBadge kind="status" value={issue.status} className="px-2 py-0.5 text-[11px]" title={detailHintByKind.status} />
                      </TableCell>
                      {showActionsColumn && (
                        <TableCell className="py-2.5 pr-3 text-right">
                          {canShowActions ? (
                            <StatusQuickActions
                              issueId={issue.id}
                              currentStatus={issue.status}
                              editHref={`/tasks/${issue.id}#edit-section`}
                              allowStatusChange={canQuickStatus}
                              allowEdit={canEditThisIssue}
                            />
                          ) : null}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={tableColumnCount} className="py-14">
                    <div className="mx-auto max-w-sm text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-foreground">No issues match this view</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {hasActiveFilterFields ? "Try adjusting your filters." : "Create the first issue to get started."}
                      </p>
                      <div className="mt-4 flex justify-center gap-2">
                        {hasActiveFilterFields && (
                          <Button asChild variant="outline" size="sm">
                            <Link href={buildClearFiltersHref()}>Clear filters</Link>
                          </Button>
                        )}
                        <Button asChild size="sm">
                          <Link href="/tasks/new">
                            <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                            Create issue
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Pagination footer ──────────────────────────────────────────────── */}
      {(hasPrev || hasNext) && (
        <div className="flex shrink-0 items-center justify-between border-t border-border/60 bg-background/95 px-3 py-2 backdrop-blur">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            Page {currentPage} / {getTotalPages(filteredTotal, pageSize)} · {filteredTotal} issues
          </span>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="h-7 text-xs" disabled={!hasPrev}>
              <Link href={hasPrev ? buildIssuesHref(currentPage - 1) : "#"} aria-disabled={!hasPrev}>
                ← Previous
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-7 text-xs" disabled={!hasNext}>
              <Link href={hasNext ? buildIssuesHref(currentPage + 1) : "#"} aria-disabled={!hasNext}>
                Next →
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
