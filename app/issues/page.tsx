import prisma from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { getAppSession } from "@/lib/auth/session";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default async function IssuesListPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; density?: string }>;
}) {
  const params = await searchParams;
  const session = await getAppSession();
  if (!session?.user) {
    return <div className="p-8">You must be logged in to view issues.</div>;
  }

  const isAdmin = session.user.role === "ADMIN";

  const currentPage = Math.max(1, Number(params?.page || "1") || 1);
  const density = params?.density === "compact" ? "compact" : "comfortable";
  const skip = (currentPage - 1) * PAGE_SIZE;

  const where = isAdmin ? {} : { createdBy: session.user.id };

  const [issues, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: { creator: { select: { name: true, email: true } } },
    }),
    prisma.issue.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const issuesTableCaption = `Showing page ${currentPage} of ${totalPages} (${total} total issues), ${density} density`;
  const cellPaddingClass = density === "compact" ? "py-1.5" : "py-3";
  const headPaddingClass = density === "compact" ? "h-9 py-1" : "h-11";

  function buildIssuesHref(page: number) {
    return `/issues?page=${page}&density=${density}`;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4 md:px-6 md:py-8">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{isAdmin ? "All Issues" : "My Issues"}</CardTitle>
            <CardDescription>{issuesTableCaption}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              variant={density === "comfortable" ? "default" : "outline"}
              size="sm">
              <Link href="/issues?density=comfortable">Comfortable</Link>
            </Button>
            <Button
              asChild
              variant={density === "compact" ? "default" : "outline"}
              size="sm">
              <Link href="/issues?density=compact">Compact</Link>
            </Button>
            <Button asChild>
              <Link href="/issues/new">Report Issue</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
                    Reporter
                  </TableHead>
                )}
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
                      {issue.creator.name || issue.creator.email}
                    </TableCell>
                  )}
                  <TableCell className={cellPaddingClass}>
                    {new Date(issue.createdAt).toLocaleString()}
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
