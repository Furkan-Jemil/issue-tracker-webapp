import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CommentThread } from "@/components/issue/CommentThread";
import { IssueActions } from "@/components/issue/IssueActions";
import { StatusQuickActions } from "@/app/issues/StatusQuickActions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { IssueSemanticBadge } from "@/components/issue/IssueSemanticBadge";

function formatDate(d: Date | string): string {
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getAppSession();

  if (!session?.user) {
    return <div className="rounded-xl border border-border/70 bg-card/80 p-4 text-sm">You must be logged in to view this issue.</div>;
  }

  const isAdmin = session.user.role === "ADMIN";
  const canQuickStatus = session.user.role === "ADMIN";

  const [issue, assignableUsers] = await Promise.all([
    prisma.issue.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        screenshots: { orderBy: { createdAt: "desc" } },
        attachments: {
          orderBy: { createdAt: "desc" },
          include: { uploader: { select: { name: true, email: true } } },
        },
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

  if (!issue) {
    notFound();
  }

  const isOwner = issue.createdBy === session.user.id;
  if (!isOwner && !isAdmin) {
    notFound();
  }

  const canEdit = isAdmin || (isOwner && issue.status === "OPEN");
  const canDelete = isAdmin;

  return (
    <div className="page-stack">
      <PageHeader
        title="Issue details"
        description={issue.title}
        breadcrumbs={[
          { label: "Issues", href: "/issues" },
          { label: issue.id.slice(0, 8).toUpperCase() },
        ]}
      />

      <Card tone="soft" className="border-border/70 bg-card/90">
        <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Issue {issue.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-sm text-muted-foreground">
              Created {formatDate(issue.createdAt)}
              {issue.reportedAt ? ` • Reported ${formatDate(issue.reportedAt)}` : ""}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <IssueSemanticBadge kind="status" value={issue.status} className="px-2.5 py-1 text-[11px]" />
              <IssueSemanticBadge kind="priority" value={issue.priority} className="px-2.5 py-1 text-[11px]" title="When this needs attention" />
              <IssueSemanticBadge kind="severity" value={issue.severity} className="px-2.5 py-1 text-[11px]" title="How much this impacts users" />
              <IssueSemanticBadge kind="type" value={issue.type} className="px-2.5 py-1 text-[11px]" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canQuickStatus && (
              <StatusQuickActions
                issueId={issue.id}
                currentStatus={issue.status}
                editHref={`/issues/${issue.id}#edit-section`}
              />
            )}
            <Button asChild variant="outline" size="sm">
              <Link href="#comments-heading">Jump to comments</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
        <Card tone="soft" density="dense" className="border-border/70 bg-card/80">
          <CardContent className="p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Status</p>
            <IssueSemanticBadge kind="status" value={issue.status} className="mt-2 px-2.5 py-1 text-[11px]" />
          </CardContent>
        </Card>

        <Card tone="soft" density="dense" className="border-border/70 bg-card/80">
          <CardContent className="p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Priority</p>
            <IssueSemanticBadge
              kind="priority"
              value={issue.priority}
              className="mt-2 px-2.5 py-1 text-[11px]"
              title="When this needs attention"
            />
          </CardContent>
        </Card>

        <Card tone="soft" density="dense" className="border-border/70 bg-card/80">
          <CardContent className="p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Severity</p>
            <IssueSemanticBadge
              kind="severity"
              value={issue.severity}
              className="mt-2 px-2.5 py-1 text-[11px]"
              title="How much this impacts users"
            />
          </CardContent>
        </Card>

        <Card tone="soft" density="dense" className="border-border/70 bg-card/80 sm:col-span-2 xl:col-span-3">
          <CardContent className="p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">People and reporting</p>
            <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Assignee</dt>
                <dd className="font-semibold text-foreground">
                  {issue.assignee ? issue.assignee.name || issue.assignee.email : "Unassigned"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Reporter</dt>
                <dd className="font-semibold text-foreground">{issue.creator.name || issue.creator.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Reported</dt>
                <dd className="font-semibold text-foreground">{issue.reportedAt ? formatDate(issue.reportedAt) : "Not specified"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="grid gap-4 p-4 md:p-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)] lg:gap-5">
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Issue summary</h2>
              <p className="mt-2 text-[15px] leading-7 text-foreground/95">{issue.description}</p>
            </div>
            {issue.url && (
              <p className="text-sm">
                <span className="font-semibold">Page or feature:</span>{" "}
                <a href={issue.url} target="_blank" rel="noopener noreferrer" className="break-all text-primary hover:underline">
                  {issue.url}
                </a>
              </p>
            )}
            {issue.sourceNotes && (
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Context note:</span>{" "}
                {issue.sourceNotes}
              </p>
            )}
          </section>

          <aside className="rounded-xl border border-border/70 bg-muted/20 p-3 md:p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Tracking snapshot</h2>
            <dl className="mt-3 divide-y divide-border/50 text-sm">
              <div className="flex items-start justify-between gap-3 py-2 first:pt-0">
                <dt className="text-muted-foreground">Issue ID</dt>
                <dd className="font-medium text-foreground">{issue.id.slice(0, 8).toUpperCase()}</dd>
              </div>
              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium text-foreground">{issue.type}</dd>
              </div>
              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="text-muted-foreground">Created</dt>
                <dd className="max-w-[14rem] break-words text-right font-medium text-foreground">{formatDate(issue.createdAt)}</dd>
              </div>
              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="text-muted-foreground">Updated</dt>
                <dd className="max-w-[14rem] break-words text-right font-medium text-foreground">{formatDate(issue.updatedAt)}</dd>
              </div>
              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="text-muted-foreground">Assignee</dt>
                <dd className="max-w-[14rem] break-words text-right font-medium text-foreground">
                  {issue.assignee ? issue.assignee.name || issue.assignee.email : "Unassigned"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3 py-2 pb-0">
                <dt className="text-muted-foreground">Reporter</dt>
                <dd className="max-w-[14rem] break-words text-right font-medium text-foreground">
                  {issue.creator.name || issue.creator.email}
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
          reportedAt: issue.reportedAt ? issue.reportedAt.toISOString().slice(0, 10) : "",
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

      {(issue.screenshots.length > 0 || issue.attachments.length > 0) && (
        <section aria-labelledby="evidence-heading" className="space-y-3">
          <h2 id="evidence-heading" className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Evidence
          </h2>
          <div className="grid gap-4 xl:grid-cols-2">
          {issue.screenshots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Screenshots</CardTitle>
                <CardDescription>Visual proof attached to this issue.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="list">
                  {issue.screenshots.map((s) => (
                    <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" role="listitem" className="group overflow-hidden rounded-lg border border-border/70 bg-background/80">
                      <img src={s.url} alt={`Screenshot: ${s.filename}`} className="h-28 w-full object-cover transition-transform duration-200 group-hover:scale-105" />
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
                <CardDescription>Reference files and uploads for this issue.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {issue.attachments.map((file) => (
                    <li key={file.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-background px-3 py-2.5">
                      <div>
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                          {file.filename}
                        </a>
                        <p className="break-words text-xs text-muted-foreground">
                          {file.mimeType} • {(file.sizeBytes / 1024).toFixed(1)} KB • Uploaded by {file.uploader.name || file.uploader.email}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          </div>
        </section>
      )}

      <section className="mt-6 space-y-3" aria-labelledby="comments-heading">
        <h2 id="comments-heading" className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Comments</h2>
        <CommentThread issueId={issue.id} comments={issue.comments} />
      </section>

      <section className="mt-6 space-y-3" aria-labelledby="activity-heading">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Activity</h2>
        <Card>
          <CardHeader>
            <CardTitle id="activity-heading" className="text-lg">Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            {issue.history.length > 0 ? (
              <ul className="space-y-2 text-sm text-muted-foreground" aria-live="polite">
                {issue.history.map((h) => (
                  <li key={h.id} className="rounded-lg border border-border/70 bg-background px-3 py-2.5">
                    <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      {formatDate(h.createdAt)}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      <span className="font-semibold">{h.eventType}</span>: {h.description}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">By {h.actor?.name || "Unknown"}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg border border-dashed border-border/70 bg-background/60 px-3 py-3 text-sm text-muted-foreground">
                No activity recorded yet.
              </div>
            )}
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
