import prisma from "@/lib/prisma";
import { IssueStatus, PrismaClient, Priority, Severity } from "@prisma/client";
import { getAppSession } from "@/lib/auth/session";
import {
  parseIssueStatus,
  parsePriority,
  parseSeverity,
} from "@/lib/issueFilters";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

export default async function FilteredIssuesPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const session = await getAppSession();
  if (!session?.user) {
    return <div className="p-8">You must be logged in to filter issues.</div>;
  }

  const isAdmin = session.user.role === "ADMIN";

  const status = parseIssueStatus(searchParams.status) || "";
  const priority = parsePriority(searchParams.priority) || "";
  const severity = parseSeverity(searchParams.severity) || "";
  const reporter =
    typeof searchParams.reporter === "string" ? searchParams.reporter : "";

  const where: {
    createdBy?: string;
    status?: IssueStatus;
    priority?: Priority;
    severity?: Severity;
  } = {};

  if (!isAdmin) {
    where.createdBy = session.user.id;
  } else if (reporter.trim()) {
    where.createdBy = reporter;
  }

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (severity) where.severity = severity;

  const [issues, reporters] = await Promise.all([
    prisma.issue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    isAdmin
      ? prisma.user.findMany({
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const activeFilters = [
    status ? `Status: ${status}` : null,
    priority ? `Priority: ${priority}` : null,
    severity ? `Severity: ${severity}` : null,
    isAdmin && reporter
      ? `Reporter: ${reporters.find((u) => u.id === reporter)?.name || reporter}`
      : null,
  ].filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-4xl px-3 py-4 md:px-6 md:py-8">
      <h1 className="mb-4 text-2xl font-bold">
        {isAdmin ? "Admin Issue Filter" : "Filter My Issues"}
      </h1>
      <form method="get" className="mb-6 flex flex-wrap gap-2">
        <label htmlFor="status" className="sr-only">
          Filter by status
        </label>
        <Select id="status" name="status" defaultValue={status}>
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </Select>
        <label htmlFor="priority" className="sr-only">
          Filter by priority
        </label>
        <Select id="priority" name="priority" defaultValue={priority}>
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </Select>
        <label htmlFor="severity" className="sr-only">
          Filter by severity
        </label>
        <Select id="severity" name="severity" defaultValue={severity}>
          <option value="">All Severities</option>
          <option value="MINOR">Minor</option>
          <option value="MAJOR">Major</option>
          <option value="CRITICAL">Critical</option>
        </Select>
        {isAdmin && (
          <>
            <label htmlFor="reporter" className="sr-only">
              Filter by reporter
            </label>
            <Select id="reporter" name="reporter" defaultValue={reporter}>
              <option value="">All Reporters</option>
              {reporters.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </Select>
          </>
        )}
        <Button type="submit">Filter</Button>
        <Button asChild variant="outline">
          <Link href="/issues/filter">Clear Filters</Link>
        </Button>
      </form>

      {activeFilters.length > 0 && (
        <div className="mb-4 text-sm text-muted-foreground">
          Active filters: {activeFilters.join(" | ")}
        </div>
      )}

      <ul className="space-y-2">
        {issues.map((issue) => (
          <li key={issue.id}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  <Link
                    href={`/issues/${issue.id}`}
                    className="text-primary hover:underline">
                    {issue.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 pt-0 text-sm">
                <div className="text-muted-foreground">
                  {issue.status} | {new Date(issue.createdAt).toLocaleString()}
                </div>
                {isAdmin && (
                  <div className="text-muted-foreground">
                    Reporter: {issue.creator.name || issue.creator.email}
                  </div>
                )}
                <div>{issue.description.slice(0, 100)}...</div>
              </CardContent>
            </Card>
          </li>
        ))}
        {issues.length === 0 && <li>No issues found.</li>}
      </ul>
    </div>
  );
}
