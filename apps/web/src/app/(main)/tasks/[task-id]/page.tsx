import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart2,
  ChevronRight,
  CircleDot,
  ExternalLink,
  Shield,
  UserCircle2,
} from "lucide-react";

import { CommentThread } from "@/app/(main)/tasks/comment-thread";
import { IssueActions } from "@/app/(main)/tasks/task-actions";
import { IssueEvidenceList } from "@/app/(main)/tasks/task-evidence-list";
import { StatusQuickActions } from "@/app/(main)/tasks/tasks-table-row-actions";
import { TaskActivityTimeline } from "@/app/(main)/tasks/task-activity-timeline";
import { MinimalBadge } from "@/app/(main)/tasks/minimal-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAbsolute, formatRelative } from "@/lib/formatRelative";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortId(id: string) {
  return `FJ-${id.slice(0, 8).toUpperCase()}`;
}

/** Returns a subtle icon + colour pair for priority levels */
function PriorityIcon({ value }: { value: string }) {
  const v = value.toUpperCase();
  if (v === "HIGH")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
        High
      </span>
    );
  if (v === "MEDIUM")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
        <BarChart2 className="h-3 w-3" aria-hidden="true" />
        Medium
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
      <CircleDot className="h-3 w-3" aria-hidden="true" />
      Low
    </span>
  );
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
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-zinc-800 dark:bg-zinc-900">
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

  const reportedTimeAgo = issue.reportedAt
    ? formatRelative(issue.reportedAt)
    : issue.createdAt
    ? formatRelative(issue.createdAt)
    : null;

  return (
    <div className="mx-auto max-w-screen-xl space-y-5 px-0 py-1">

      {/* ── Command Header ──────────────────────────────────────────────── */}
      <header className="space-y-3">

        {/* Breadcrumb + action row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500">
            <Link
              href="/tasks"
              className="font-mono uppercase tracking-wider transition-colors hover:text-slate-700 dark:hover:text-zinc-300"
            >
              Tasks
            </Link>
            <ChevronRight className="h-3 w-3 opacity-50" aria-hidden="true" />
            <span className="font-mono uppercase tracking-wider text-slate-600 dark:text-zinc-400">
              {shortId(issue.id)}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <StatusQuickActions
                issueId={issue.id}
                currentStatus={issue.status}
                editHref={`/tasks/${issue.id}#edit-section`}
              />
            )}
            {canEdit && (
              <Button asChild size="sm">
                <Link href="#edit-section">Edit Details</Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href="#comments-heading">Jump to Comments</Link>
            </Button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-snug">
          {issue.title}
        </h1>

        {/* Reporter line */}
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Reported by{" "}
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {reporterName}
          </span>
          {reportedTimeAgo && (
            <> · <span>{reportedTimeAgo}</span></>
          )}
        </p>

        {/* ── Metadata ribbon — single h-10 flex bar ─────────────────────── */}
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-200/70 bg-slate-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/60"
          aria-label="Issue metadata"
        >
          {/* Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Status
            </span>
            <MinimalBadge kind="status" value={issue.status} />
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-zinc-700" aria-hidden="true" />

          {/* Priority */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Priority
            </span>
            <PriorityIcon value={issue.priority} />
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-zinc-700" aria-hidden="true" />

          {/* Severity */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Severity
            </span>
            <MinimalBadge kind="severity" value={issue.severity} />
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-zinc-700" aria-hidden="true" />

          {/* Assignee */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Assignee
            </span>
            {assigneeName ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold uppercase text-slate-600 dark:bg-zinc-700 dark:text-zinc-300"
                >
                  {assigneeName[0]}
                </span>
                {assigneeName}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs italic text-slate-400 dark:text-zinc-500">
                <UserCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Unassigned
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── 8 / 4 Two-Column Body ──────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">

        {/* ── Left — main content ──────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Description */}
          <Card className="overflow-hidden border-slate-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Description &amp; Reproduction
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-5">
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
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
              className="group flex items-center gap-3 rounded-lg border border-slate-200/80 bg-white px-4 py-3 transition-all hover:border-slate-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800">
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:text-zinc-500 dark:group-hover:text-zinc-300" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  External Reference
                </p>
                <p className="mt-0.5 truncate font-mono text-xs text-blue-600 group-hover:underline dark:text-blue-400">
                  {issue.url}
                </p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-slate-400 dark:text-zinc-600" aria-hidden="true" />
            </a>
          )}

          {/* Source notes */}
          {issue.sourceNotes && (
            <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-3 dark:border-amber-900/30 dark:bg-amber-950/20">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-500">
                Context Note
              </p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                {issue.sourceNotes}
              </p>
            </div>
          )}

          {/* Evidence & Attachments */}
          <Card className="overflow-hidden border-slate-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
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

          {/* Discussion */}
          <section aria-labelledby="comments-heading">
            <CommentThread issueId={issue.id} comments={issue.comments} />
          </section>
        </div>

        {/* ── Right — sidebar rail ──────────────────────────────────────── */}
        <aside className="space-y-4">

          {/* Tracking Snapshot */}
          <Card className="overflow-hidden border-slate-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Tracking Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <dl className="divide-y divide-slate-100 dark:divide-zinc-800">
                <SnapshotRow label="Issue ID">
                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                    #{shortId(issue.id)}
                  </span>
                </SnapshotRow>
                <SnapshotRow label="Type">
                  <MinimalBadge kind="type" value={issue.type} />
                </SnapshotRow>
                <SnapshotRow label="Created">
                  <time
                    dateTime={new Date(issue.createdAt).toISOString()}
                    className="font-mono text-xs text-slate-500 dark:text-zinc-400"
                  >
                    {formatAbsolute(issue.createdAt)}
                  </time>
                </SnapshotRow>
                <SnapshotRow label="Updated">
                  <time
                    dateTime={new Date(issue.updatedAt).toISOString()}
                    className="font-mono text-xs text-slate-500 dark:text-zinc-400"
                  >
                    {formatAbsolute(issue.updatedAt)}
                  </time>
                </SnapshotRow>
                <SnapshotRow label="Reporter">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {reporterName}
                  </span>
                </SnapshotRow>
                <SnapshotRow label="Access Scope">
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                    <Shield className="h-3 w-3 shrink-0" aria-hidden="true" />
                    CASL Enforced
                  </span>
                </SnapshotRow>
              </dl>
            </CardContent>
          </Card>

          {/* Back button */}
          <Button asChild variant="outline" size="sm" className="w-full border-slate-200 hover:bg-slate-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
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

      {/* ── Activity Timeline ─────────────────────────────────────────── */}
      <section aria-labelledby="activity-heading">
        <Card className="overflow-hidden border-slate-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
            <CardTitle
              id="activity-heading"
              className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500"
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
      <dt className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500">
        {label}
      </dt>
      <dd className="flex justify-end">{children}</dd>
    </div>
  );
}
