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
import { IssuesBoard } from "@/app/(main)/tasks/tasks-table";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IssuesToolbar } from "@/app/(main)/tasks/tasks-table-header";
import { IssueListClient } from "@/app/(main)/tasks/issue-list-client";
import type { ListIssue } from "@/app/(main)/tasks/issue-list-client";

import { DEFAULT_PAGE_SIZE, ISSUES_PAGE_SIZE } from "@/lib/constants";
import { getPaginationMeta, getTotalPages } from "@/lib/pagination";

export default async function IssuesListPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string;
    view?: string;
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
    return (
      <div className="rounded-xl border border-border/70 bg-card/80 p-4 text-sm">
        You must be logged in to view issues.
      </div>
    );
  }

  const isAdmin = session.user.role === "ADMIN";
  const canQuickStatus = isAdmin;
  const canEditIssue = true;

  // ── View / pagination params ──────────────────────────────────────────
  const view =
    params?.view === "board"
      ? "board"
      : params?.view === "details"
        ? "details"
        : "compact";
  const isBoard = view === "board";
  const currentPage = Math.max(1, Number(params?.page ?? "1") || 1);
  const pageSize = isBoard ? ISSUES_PAGE_SIZE : DEFAULT_PAGE_SIZE;
  const showDetails = view === "details";
  const notice = params?.notice ?? "";

  // ── Filter params ─────────────────────────────────────────────────────
  // BUG FIX: Status, priority, and severity filters were previously gated to
  // ADMIN only (`const status = isAdmin ? parse(...) : ""`). This prevented
  // TESTER and USER roles from filtering their own assigned/created issues.
  //
  // Fix: parse the filter params for ALL roles. Row-level security is enforced
  // by the `baseWhere` clause below — non-admins already see only issues they
  // created or are assigned to. Filters just further narrow that scoped set;
  // they cannot widen it to see other users' issues.
  const query = params?.q?.trim() ?? "";
  const status = parseIssueStatus(params?.status) ?? "";
  const priority = parsePriority(params?.priority) ?? "";
  const severity = parseSeverity(params?.severity) ?? "";

  // Reporter and assignee cross-user filters remain admin-only because they
  // reference other users' IDs which non-admins should not enumerate.
  const reporter =
    isAdmin && typeof params?.reporter === "string"
      ? params.reporter.trim()
      : "";
  const assignee =
    isAdmin && typeof params?.assignee === "string"
      ? params.assignee.trim()
      : "";

  const createdFromRaw = params?.createdFrom?.trim() ?? "";
  const createdToRaw = params?.createdTo?.trim() ?? "";
  const createdFrom = /^\d{4}-\d{2}-\d{2}$/.test(createdFromRaw)
    ? new Date(`${createdFromRaw}T00:00:00.000Z`)
    : null;
  const createdTo = /^\d{4}-\d{2}-\d{2}$/.test(createdToRaw)
    ? new Date(`${createdToRaw}T23:59:59.999Z`)
    : null;

  const skip = (currentPage - 1) * pageSize;

  // ── Row-level security base ───────────────────────────────────────────
  // Non-admins see only issues they created OR are assigned to. This clause
  // is always applied before any filter is added — filters narrow within it.
  const baseWhere = isAdmin
    ? {}
    : {
        OR: [
          { createdBy: session.user.id },
          { assigneeId: session.user.id },
        ],
      };

  // ── Filter-augmented where clause ─────────────────────────────────────
  const where = {
    ...baseWhere,
    ...(isAdmin && reporter ? { createdBy: reporter } : {}),
    ...(isAdmin && assignee ? { assigneeId: assignee } : {}),
    ...(query
      ? { title: { contains: query, mode: "insensitive" as const } }
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

  // ── Queries ───────────────────────────────────────────────────────────
  const [issues, filteredTotal, totalVisible, reporters, assignableUsers] = await Promise.all([
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
    // Reporters list is admin-only (used for the reporter/assignee filter UI
    // and for displaying names in the "Reporter" table column).
    isAdmin
      ? prisma.user.findMany({
          select: { id: true, name: true, email: true, role: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    // Assignable users for the quick-create drawer are fetched for ALL roles
    // so the "Assign to" dropdown is populated regardless of the viewer's role.
    // Non-admins still cannot see users outside their org — the query returns
    // the same global list that the full-page /tasks/new form uses.
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const { totalPages, hasPrev, hasNext } = getPaginationMeta(
    filteredTotal,
    pageSize,
    currentPage,
  );

  const hasActiveFilterFields = Boolean(
    status || priority || severity || reporter || assignee || createdFrom || createdTo,
  );
  const activeFilterCount = [
    status,
    priority,
    severity,
    reporter,
    assignee,
    createdFromRaw,
    createdToRaw,
  ].filter(Boolean).length;

  // ── Shape data for client components ─────────────────────────────────
  // Serialise dates to ISO strings — plain objects only cross the
  // Server → Client boundary.
  const listIssues: ListIssue[] = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    type: issue.type,
    priority: issue.priority,
    severity: issue.severity,
    status: issue.status as ListIssue["status"],
    createdAt: issue.createdAt.toISOString(),
    reportedAt: issue.reportedAt ? issue.reportedAt.toISOString() : null,
    createdBy: issue.createdBy,
    assigneeId: issue.assigneeId,
  }));

  const boardIssues = listIssues.map((i) => ({
    ...i,
    status: i.status as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED",
  }));

  const assigneeLabelById = Object.fromEntries(
    reporters.map((u) => [u.id, u.name ?? u.email]),
  );

  const reportersForClient = reporters.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
  }));

  // All users are potential assignees in the drawer form.
  // We use the dedicated assignableUsers query (fetched for all roles above)
  // so non-admins also see the full user list when filing via the drawer.
  const assigneesForCreate = assignableUsers.map((u) => ({
    id: u.id,
    label: u.name ?? u.email,
  }));

  // ── URL builders ──────────────────────────────────────────────────────
  function appendFilterParams(p: URLSearchParams) {
    if (query) p.set("q", query);
    if (status) p.set("status", status);
    if (priority) p.set("priority", priority);
    if (severity) p.set("severity", severity);
    if (reporter) p.set("reporter", reporter);
    if (assignee) p.set("assignee", assignee);
    if (createdFromRaw) p.set("createdFrom", createdFromRaw);
    if (createdToRaw) p.set("createdTo", createdToRaw);
  }

  function buildPageHref(page: number) {
    const p = new URLSearchParams({ page: String(page), view });
    appendFilterParams(p);
    return `/tasks?${p.toString()}`;
  }

  function buildClearFiltersHref() {
    const p = new URLSearchParams({ view, page: "1" });
    if (query) p.set("q", query);
    return `/tasks?${p.toString()}`;
  }

  function buildDismissNoticeHref() {
    const p = new URLSearchParams({ page: String(currentPage), view });
    appendFilterParams(p);
    return `/tasks?${p.toString()}`;
  }

  // ── Render ────────────────────────────────────────────────────────────
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
          reporters={reporters.map((u) => ({
            id: u.id,
            label: u.name ?? u.email,
            role: u.role,
          }))}
          onSubmitHref="/tasks"
          onResetHref={buildClearFiltersHref()}
        />

        {/* Admin-dashboard-redirect notice */}
        {notice === "admin-dashboard-only" ? (
          <Card className="border-amber-300 bg-amber-50/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Dashboard access is admin-only
              </CardTitle>
              <CardDescription className="text-amber-900/80">
                You were redirected to Issues.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild variant="outline" size="sm">
                <Link href={buildDismissNoticeHref()}>Dismiss</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {/* Board or table view */}
        {isBoard ? (
          <IssuesBoard
            issues={boardIssues}
            assigneeLabelById={assigneeLabelById}
            canManageStatus={canQuickStatus}
            canEditIssue={canEditIssue}
            canEditAllIssues={isAdmin}
          />
        ) : (
          // IssueListClient owns the mutable issue state for optimistic updates.
          // The Server Component provides the initial snapshot; the client drives
          // status badge changes immediately without router.refresh().
          <IssueListClient
            initialIssues={listIssues}
            showDetails={showDetails}
            canQuickStatus={canQuickStatus}
            canEditIssue={canEditIssue}
            isAdmin={isAdmin}
            reporters={reportersForClient}
            totalVisible={totalVisible}
            filteredTotal={filteredTotal}
            currentPage={currentPage}
            totalPages={getTotalPages(filteredTotal, pageSize)}
            assigneesForCreate={assigneesForCreate}
          />
        )}

        {/* Pagination is rendered inside IssueListClient's table footer */}
      </section>
    </div>
  );
}
