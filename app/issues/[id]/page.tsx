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
    return <div className="rounded-xl border border-border/70 bg-card/80 p-4 text-sm">You must be logged in to view this issue.</div>;
  }
  const isAdmin = session.user.role === "ADMIN";

  const [issue, assignableUsers] = await Promise.all([
    prisma.issue.findUnique({
      where: { id: routeParams.id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        attachments: {
          orderBy: { order: "asc" },
          include: { uploader: { select: { name: true, email: true } } },
        },
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
    }),
    isAdmin
      ? prisma.user.findMany({
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const isOwner = issue?.createdBy === session.user.id;
  if (!issue || (!isOwner && !isAdmin)) {
    notFound();
  }

  const canEdit = isAdmin || (isOwner && issue.status === "OPEN");
  const canDelete = isAdmin;

  return (
    <div className="page-stack">
      <Card className="overflow-hidden">
        <CardHeader className="gap-3 border-b border-border/60 bg-muted/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-xl md:text-2xl">{issue.title}</CardTitle>
              <p className="page-subtitle">Issue details, ownership, and activity timeline.</p>
            </div>
            <Badge variant={statusVariant(issue.status)}>{issue.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)] lg:gap-6">
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Description
              </h2>
              <p className="mt-2 text-sm leading-6 text-foreground/95">{issue.description}</p>
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
            {issue.sourceNotes && (
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Source notes:</span>{" "}
                {issue.sourceNotes}
              </p>
            )}
          </section>

          <aside className="rounded-xl border border-border/70 bg-muted/20 p-3 md:p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Properties
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium text-foreground">{issue.type}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Priority</dt>
                <dd className="font-medium text-foreground">{issue.priority}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Severity</dt>
                <dd className="font-medium text-foreground">{issue.severity}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Reported</dt>
                <dd className="text-right font-medium text-foreground">
                  {issue.reportedAt ? formatDate(issue.reportedAt) : "Not specified"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Created</dt>
                <dd className="text-right font-medium text-foreground">{formatDate(issue.createdAt)}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Assignee</dt>
                <dd className="text-right font-medium text-foreground">
                  {issue.assignee ? issue.assignee.name || issue.assignee.email : "Unassigned"}
                </dd>
              </div>
            </dl>
          </aside>
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
          sourceNotes: issue.sourceNotes,
          reportedAt: issue.reportedAt
            ? issue.reportedAt.toISOString().slice(0, 10)
            : "",
          assigneeId: issue.assigneeId,
          status: issue.status,
        }}
        canEdit={canEdit}
        canDelete={canDelete}
        isAdmin={isAdmin}
        assigneeOptions={assignableUsers.map((u) => ({
          id: u.id,
          label: u.name || u.email,
        }))}
      />

      {/* Screenshot gallery */}
      {(issue.screenshots.length > 0 || issue.attachments.length > 0) && (
        <section aria-labelledby="evidence-heading" className="grid gap-4 xl:grid-cols-2">
          {issue.screenshots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle id="evidence-heading" className="text-lg">
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
          )}

          {issue.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Associated files</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {issue.attachments.map((file) => (
                    <li
                      key={file.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
                      <div>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline">
                          {file.filename}
                        </a>
                        <p className="text-xs text-muted-foreground">
                          {file.mimeType} • {(file.sizeBytes / 1024).toFixed(1)} KB • Uploaded by{" "}
                          {file.uploader.name || file.uploader.email}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
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
                  [{formatDate(h.createdAt)}] {h.eventType}: {h.description} by{" "}
                  {h.actor?.name || "Unknown"}
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
