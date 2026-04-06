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
import { Input } from "@/components/ui/input";
import { ListChecks, Search } from "lucide-react";
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

const PAGE_SIZE = 20;

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
    density?: string;
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
    return <div className="p-8">You must be logged in to view issues.</div>;
  }

  const isAdmin = session.user.role === "ADMIN";

  const currentPage = Math.max(1, Number(params?.page || "1") || 1);
  const density = params?.density === "compact" ? "compact" : "comfortable";
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
  const skip = (currentPage - 1) * PAGE_SIZE;

  const where = {
    ...(isAdmin ? {} : { createdBy: session.user.id }),
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

  const [issues, total, reporters] = await Promise.all([
    prisma.issue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
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
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const reporterById = new Map(
    reporters.map((user) => [user.id, user.name || user.email]),
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const hasActiveFilters = Boolean(
    query || status || priority || severity || reporter || assignee,
  );
  const issuesTableCaption = `Showing page ${currentPage} of ${totalPages} (${total} total issues), ${density} density`;
  const cellPaddingClass = density === "compact" ? "py-1.5" : "py-3";
  const headPaddingClass = density === "compact" ? "h-9 py-1" : "h-11";

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
      density,
    });
    appendToolbarParams(nextParams);
    return `/issues?${nextParams.toString()}`;
  }

  function buildDismissNoticeHref() {
    const nextParams = new URLSearchParams({
      page: String(currentPage),
      density,
    });
    appendToolbarParams(nextParams);
    return `/issues?${nextParams.toString()}`;
  }

  function buildDensityHref(nextDensity: "compact" | "comfortable") {
    const nextParams = new URLSearchParams({ density: nextDensity, page: "1" });
    appendToolbarParams(nextParams);
    return `/issues?${nextParams.toString()}`;
  }

  function buildClearFiltersHref() {
    const nextParams = new URLSearchParams({ density, page: "1" });
    return `/issues?${nextParams.toString()}`;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4 md:px-6 md:py-8">
      <div className="mb-6 flex gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
          <ListChecks className="h-5 w-5" strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {isAdmin ? "All issues" : "My issues"}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Search, filter, and triage reports in one place. Adjust density for
            quick scans or comfortable reading.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-border/60 bg-muted/30 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Queue</CardTitle>
            <CardDescription>{issuesTableCaption}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              variant={density === "comfortable" ? "default" : "outline"}
              size="sm">
              <Link href={buildDensityHref("comfortable")}>Comfortable</Link>
            </Button>
            <Button
              asChild
              variant={density === "compact" ? "default" : "outline"}
              size="sm">
              <Link href={buildDensityHref("compact")}>Compact</Link>
            </Button>
            <Button asChild>
              <Link href="/issues/new">Report Issue</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {notice === "admin-dashboard-only" && (
            <Card className="border-amber-300 bg-amber-50/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Dashboard Is Admin-Only
                </CardTitle>
                <CardDescription className="text-amber-900/80">
                  Per system access rules, the Dashboard is restricted to Admin
                  users. You have been redirected to the Issues page.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button asChild variant="outline" size="sm">
                  <Link href={buildDismissNoticeHref()}>Dismiss</Link>
                </Button>
              </CardContent>
            </Card>
          )}
          <form method="get" className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="density" value={density} />
            <div className="relative min-w-[220px] flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <label htmlFor="issues-title-search" className="sr-only">
                Search issue title
              </label>
              <Input
                id="issues-title-search"
                name="q"
                defaultValue={query}
                placeholder="Search by issue title..."
                className="pl-9"
              />
            </div>
            {isAdmin && (
              <>
                <label htmlFor="issues-status-filter" className="sr-only">
                  Filter by status
                </label>
                <select
                  id="issues-status-filter"
                  name="status"
                  defaultValue={status}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>

                <label htmlFor="issues-priority-filter" className="sr-only">
                  Filter by priority
                </label>
                <select
                  id="issues-priority-filter"
                  name="priority"
                  defaultValue={priority}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>

                <label htmlFor="issues-severity-filter" className="sr-only">
                  Filter by severity
                </label>
                <select
                  id="issues-severity-filter"
                  name="severity"
                  defaultValue={severity}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">All Severities</option>
                  <option value="MINOR">Minor</option>
                  <option value="MAJOR">Major</option>
                  <option value="CRITICAL">Critical</option>
                </select>

                <label htmlFor="issues-reporter-filter" className="sr-only">
                  Filter by reporter
                </label>
                <select
                  id="issues-reporter-filter"
                  name="reporter"
                  defaultValue={reporter}
                  className="h-10 min-w-52 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">All Reporters</option>
                  {reporters.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>

                <label htmlFor="issues-assignee-filter" className="sr-only">
                  Filter by assignee
                </label>
                <select
                  id="issues-assignee-filter"
                  name="assignee"
                  defaultValue={assignee}
                  className="h-10 min-w-52 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">All Assignees</option>
                  {reporters.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </>
            )}
            <Button type="submit" size="sm">
              {isAdmin ? "Apply" : "Search"}
            </Button>
            {hasActiveFilters && (
              <Button asChild variant="outline" size="sm">
                <Link href={buildClearFiltersHref()}>Clear Filters</Link>
              </Button>
            )}
          </form>
          <Table>
            <caption className="sr-only">{issuesTableCaption}</caption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className={headPaddingClass}>
                  Title
                </TableHead>
                <TableHead scope="col" className={headPaddingClass}>
                  Type
                </TableHead>
                <TableHead scope="col" className={headPaddingClass}>
                  Priority
                </TableHead>
                <TableHead scope="col" className={headPaddingClass}>
                  Severity
                </TableHead>
                <TableHead scope="col" className={headPaddingClass}>
                  Status
                </TableHead>
                {isAdmin && (
                  <TableHead scope="col" className={headPaddingClass}>
                    Assignee
                  </TableHead>
                )}
                {isAdmin && (
                  <TableHead scope="col" className={headPaddingClass}>
                    Reporter
                  </TableHead>
                )}
                <TableHead scope="col" className={headPaddingClass}>
                  Reported
                </TableHead>
                <TableHead scope="col" className={headPaddingClass}>
                  Created
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell className={cellPaddingClass}>
                    <Link
                      href={`/issues/${issue.id}`}
                      className="font-medium text-primary hover:underline">
                      {issue.title}
                    </Link>
                  </TableCell>
                  <TableCell className={cellPaddingClass}>
                    {issue.type}
                  </TableCell>
                  <TableCell className={cellPaddingClass}>
                    {issue.priority}
                  </TableCell>
                  <TableCell className={cellPaddingClass}>
                    {issue.severity}
                  </TableCell>
                  <TableCell className={cellPaddingClass}>
                    <Badge variant={statusVariant(issue.status)}>
                      {issue.status}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className={cellPaddingClass}>
                      {issue.assigneeId
                        ? reporterById.get(issue.assigneeId) || "Unknown assignee"
                        : "Unassigned"}
                    </TableCell>
                  )}
                  {isAdmin && (
                    <TableCell className={cellPaddingClass}>
                      {reporterById.get(issue.createdBy) || "Unknown reporter"}
                    </TableCell>
                  )}
                  <TableCell className={cellPaddingClass}>
                    {issue.reportedAt ? formatDate(issue.reportedAt) : "-"}
                  </TableCell>
                  <TableCell className={cellPaddingClass}>
                    {formatDate(issue.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>
              Page {currentPage} of {totalPages}
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
