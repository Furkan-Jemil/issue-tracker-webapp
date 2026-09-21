import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Shield } from "lucide-react";

import { CommentThread } from "@/app/(main)/tasks/comment-thread";
import { IssueActions } from "@/app/(main)/tasks/task-actions";
import { IssueEvidenceList } from "@/app/(main)/tasks/task-evidence-list";
import { StatusQuickActions } from "@/app/(main)/tasks/tasks-table-row-actions";
import { TaskActivityTimeline } from "@/app/(main)/tasks/task-activity-timeline";
import { MinimalBadge } from "@/app/(main)/tasks/minimal-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAbsolute } from "@/lib/formatRelative";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortId(id: string) {
  return `#FJ-${id.slice(0, 8).toUpperCase()}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ "task-id": string }>;
}) {
  const { "task-id": id } = await params;
  const session = await getAppSession();

  if (!session?.user) {
    return (
      <div className="rounded-xl border border-border/70 bg-card/80 p-4 text-sm text-muted-foreground">
        You must be logged in to view this issue.
      </div>
    );
  }

  const isAdmin = session.user.role === "ADMIN";

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

  if (!issue) notFound();

  const isOwner = issue.createdBy === session.user.id;
  if (!isOwner && !isAdmin) notFound();

  const canEdit = isAdmin || (isOwner && issue.status === "OPEN");
  const canDelete = isAdmin;
  const reporterName = issue.creator.name || issue.creator.email;
  const assigneeName = issue.assignee
    ? issue.assignee.name || issue.assignee.email
    : null;

  return (
    <div className="mx-auto max-w-screen-xl space-y-5 px-0 py-1">

      {/* ── Command Header ──────────────────────────────────────────────── */}
      <header className="space-y-3">

        {/* Breadcrumb row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link
              href="/tasks"
              className="font-mono uppercase tracking-wider hover:text-foreground transition-colors"
            >
              Tasks
            </Link>
            <span aria-hidden="true" className="opacity-40">/</span>
            <span className="font-mono uppercase tracking-wider text-foreground/70">
              {shortId(issue.id)}
            </span>
          </nav>

          {/* Top-right actions */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <StatusQuickActions
                issueId={issue.id}
                currentStatus={issue.status}
                editHref={`/tasks/${issue.id}#edit-section`}
              />
            )}
            {canEdit && (
              <Button asChild variant="default" size="sm">
                <Link href={`#edit-section`}>Edit Details</Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href="#comments-heading">Jump to Comments</Link>
            </Button>
          </div>
        </div>

        {/* Title + reporter */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
            {issue.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reported by{" "}
            <span className="font-medium text-foreground">{reporterName}</span>
            {issue.reportedAt && (
              <>
                {" "}on{" "}
                <time
                  dateTime={new Date(issue.reportedAt).toISOString()}
                  className="font-mono text-xs"
                >
                  {formatAbsolute(issue.reportedAt)}
                </time>
              </>
            )}
          </p>
        </div>

        {/* Status strip — 4-column responsive grid */}
        <div className="grid grid-cols-2 divide-x divide-border/60 rounded-xl border border-border/60 bg-card sm:grid-cols-4">
          <div className="flex flex-col gap-1 px-4 py-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Lifecycle
            </span>
            <MinimalBadge kind="status" value={issue.status} />
          </div>
          <div className="flex flex-col gap-1 px-4 py-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Priority
            </span>
            <MinimalBadge kind="priority" value={issue.priority} />
          </div>
          <div className="flex flex-col gap-1 px-4 py-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Severity
            </span>
            <MinimalBadge kind="severity" value={issue.severity} />
          </div>
          <div className="flex flex-col gap-1 px-4 py-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Assigned Owner
            </span>
            {assigneeName ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold uppercase text-muted-foreground"
                >
                  {assigneeName[0]}
                </span>
                <span className="truncate">{assigneeName}</span>
              </span>
            ) : (
              <span className="text-sm italic text-muted-foreground/60">
                Unassigned
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── 8 / 4 Two-Column Body ──────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">

        {/* Left — 8 cols */}
        <div className="space-y-5">

          {/* Description card */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/60 bg-muted/30 px-5 py-3">
              <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Description &amp; Reproduction
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4">
              <p className="text-[15px] leading-7 text-foreground/85 whitespace-pre-wrap">
                {issue.description}
              </p>
            </CardContent>
          </Card>

          {/* External reference */}
          {issue.url && (
            <a
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition-colors hover:border-border hover:bg-accent/30"
            >
              <ExternalLink
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  External Reference
                </p>
                <p className="mt-0.5 truncate font-mono text-xs text-foreground group-hover:underline">
                  {issue.url}
                </p>
              </div>
            </a>
          )}

          {/* Source notes */}
          {issue.sourceNotes && (
            <div className="rounded-xl border border-border/60 bg-card px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Context Note
              </p>
              <p className="mt-1 text-sm text-foreground/80">
                {issue.sourceNotes}
              </p>
            </div>
          )}

          {/* Evidence */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/60 bg-muted/30 px-5 py-3">
              <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Evidence &amp; Attachments
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4">
              <IssueEvidenceList
                screenshots={issue.screenshots}
                attachments={issue.attachments}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right — 4 cols sidebar rail */}
        <aside className="space-y-4">

          {/* Tracking snapshot */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/60 bg-muted/30 px-4 py-3">
              <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Tracking Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <dl className="divide-y divide-border/50">
                <SnapshotRow label="Issue ID">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {shortId(issue.id)}
                  </span>
                </SnapshotRow>
                <SnapshotRow label="Type">
                  <MinimalBadge kind="type" value={issue.type} />
                </SnapshotRow>
                <SnapshotRow label="Created">
                  <time
                    dateTime={new Date(issue.createdAt).toISOString()}
                    className="font-mono text-xs text-foreground/80"
                  >
                    {formatAbsolute(issue.createdAt)}
                  </time>
                </SnapshotRow>
                <SnapshotRow label="Last Updated">
                  <time
                    dateTime={new Date(issue.updatedAt).toISOString()}
                    className="font-mono text-xs text-foreground/80"
                  >
                    {formatAbsolute(issue.updatedAt)}
                  </time>
                </SnapshotRow>
                <SnapshotRow label="Reporter">
                  <span className="text-xs font-medium text-foreground">
                    {reporterName}
                  </span>
                </SnapshotRow>
                <SnapshotRow label="Access Scope">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield
                      className="h-3 w-3 shrink-0"
                      aria-hidden="true"
                    />
                    CASL Enforced
                  </span>
                </SnapshotRow>
              </dl>
            </CardContent>
          </Card>

          {/* Back link */}
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/tasks">← Back to Tasks</Link>
          </Button>
        </aside>
      </div>

      {/* ── Edit / Delete Actions ─────────────────────────────────────── */}
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

      {/* ── Discussion ───────────────────────────────────────────────────── */}
      <section aria-labelledby="comments-heading">
        <CommentThread issueId={issue.id} comments={issue.comments} />
      </section>

      {/* ── Activity Timeline ─────────────────────────────────────────── */}
      <section aria-labelledby="activity-heading">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/60 bg-muted/30 px-5 py-3">
            <CardTitle
              id="activity-heading"
              className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-4">
            <TaskActivityTimeline history={issue.history} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ─── SnapshotRow ──────────────────────────────────────────────────────────────

function SnapshotRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground shrink-0">
        {label}
      </dt>
      <dd className="flex justify-end">{children}</dd>
    </div>
  );
}
