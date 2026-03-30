import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CommentThread } from "@/components/issue/CommentThread";
import { IssueActions } from "@/components/issue/IssueActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(d: Date | string): string {
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

function statusVariant(status: string) {
  if (status === "OPEN") return "warning" as const;
  if (status === "IN_PROGRESS") return "secondary" as const;
  if (status === "RESOLVED") return "success" as const;
  return "outline" as const;
}

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = await params;
  const session = await getAppSession();
  if (!session?.user) {
    return <div className="p-8">You must be logged in to view this issue.</div>;
  }
  const issue = await prisma.issue.findUnique({
    where: { id: routeParams.id },
    include: {
      screenshots: true,
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true } } },
      },
      history: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { name: true } } },
      },
    },
  });
  const isAdmin = session.user.role === "ADMIN";
  const isOwner = issue?.createdBy === session.user.id;
  if (!issue || (!isOwner && !isAdmin)) {
    notFound();
  }

  const canEdit = isAdmin || (isOwner && issue.status === "OPEN");
  const canDelete = isAdmin;

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-4 md:px-6 md:py-8">
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-2xl">{issue.title}</CardTitle>
            <Badge variant={statusVariant(issue.status)}>{issue.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>{issue.description}</p>
          <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <p>
              <span className="font-semibold text-foreground">Type:</span>{" "}
              {issue.type}
            </p>
            <p>
              <span className="font-semibold text-foreground">Priority:</span>{" "}
              {issue.priority}
            </p>
            <p>
              <span className="font-semibold text-foreground">Severity:</span>{" "}
              {issue.severity}
            </p>
            <p>
              <span className="font-semibold text-foreground">Created:</span>{" "}
              {formatDate(issue.createdAt)}
            </p>
          </div>
          {issue.url && (
            <p className="text-sm">
              <span className="font-semibold">URL:</span>{" "}
              <a
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline">
                {issue.url}
              </a>
            </p>
          )}
        </CardContent>
      </Card>

      <IssueActions
        issueId={issue.id}
        initial={{
          title: issue.title,
          description: issue.description,
          type: issue.type,
          priority: issue.priority,
          severity: issue.severity,
          url: issue.url,
          status: issue.status,
        }}
        canEdit={canEdit}
        canDelete={canDelete}
        isAdmin={isAdmin}
      />

      {/* Screenshot gallery */}
      {issue.screenshots.length > 0 && (
        <section className="mt-6" aria-labelledby="screenshots-heading">
          <Card>
            <CardHeader>
              <CardTitle id="screenshots-heading" className="text-lg">
                Screenshots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2" role="list">
                {issue.screenshots.map((s) => (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="listitem"
                    className="overflow-hidden rounded-md border">
                    <img
                      src={s.url}
                      alt={`Screenshot: ${s.filename}`}
                      className="h-24 w-24 object-cover transition-transform hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
      {/* Comment thread */}
      <section className="mt-8" aria-labelledby="comments-heading">
        <h2 id="comments-heading" className="sr-only">
          Comments section
        </h2>
        <CommentThread issueId={issue.id} comments={issue.comments} />
      </section>
      {/* Issue history */}
      <section className="mt-8" aria-labelledby="activity-heading">
        <Card>
          <CardHeader>
            <CardTitle id="activity-heading" className="text-lg">
              Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul
              className="space-y-2 text-sm text-muted-foreground"
              aria-live="polite">
              {issue.history.map((h) => (
                <li
                  key={h.id}
                  className="rounded-md border bg-background px-3 py-2">
                  [{formatDate(h.createdAt)}] {h.eventType}:{" "}
                  {h.description} by {h.actor?.name || "Unknown"}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
      <div className="mt-6">
        <Button asChild variant="outline">
          <Link href="/issues">Back to Issues</Link>
        </Button>
      </div>
    </div>
  );
}
