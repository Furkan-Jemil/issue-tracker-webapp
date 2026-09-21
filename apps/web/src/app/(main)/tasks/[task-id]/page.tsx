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

import { ActivityFeed } from "@/app/(main)/tasks/activity-feed";
import { SidebarActions } from "@/app/(main)/tasks/sidebar-actions";
import { IssueEvidenceList } from "@/app/(main)/tasks/task-evidence-list";
import { StatusQuickActions } from "@/app/(main)/tasks/tasks-table-row-actions";
import { MinimalBadge } from "@/app/(main)/tasks/minimal-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAbsolute, formatRelative } from "@/lib/formatRelative";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortId(id: string) {
  return `#FJ-${id.slice(0, 8).toUpperCase()}`;
}

function PriorityIndicator({ value }: { value: string }) {
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
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
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
      <div className="rounded-xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">
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

  const isOwner   = issue.createdBy === session.user.id;
  if (!isOwner && !isAdmin) notFound();

  const canEdit   = isAdmin || (isOwner && issue.status === "OPEN");
  const canDelete = isAdmin;

  const reporterName    = issue.creator.name || issue.creator.email;
  const assigneeName    = issue.assignee ? issue.assignee.name || issue.assignee.email : null;
  const reportedTimeAgo = issue.reportedAt
    ? formatRelative(issue.reportedAt)
    : formatRelative(issue.createdAt);

  return (
    <div className="mx-auto max-w-screen-xl space-y-4 px-0 py-1">

      {/* ── Command Header ────────────────────────────────────────────── */}
      <header className="space-y-3">

        {/* Breadcrumb + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <Link href="/tasks" className="uppercase tracking-wider transition-colors hover:text-foreground">
              Tasks
            </Link>
            <ChevronRight className="h-3 w-3 opacity-40" aria-hidden="true" />
            <span className="uppercase tracking-wider text-foreground/60">
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
              <Link href="#activity-feed">Jump to Comments</Link>
            </Button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight text-foreground leading-snug">
          {issue.title}
        </h1>

        {/* Reporter line */}
        <p className="text-sm text-muted-foreground">
          Reported by{" "}
          <span className="font-medium text-foreground">{reporterName}</span>
          {" · "}
          <span>{reportedTimeAgo}</span>
        </p>

        {/* ── Unified metadata ribbon ───────────────────────────────────── */}
        <div
          className="flex flex-wrap items-center gap-4 rounded-md border border-border/60 bg-muted/40 px-4 py-2.5 text-xs"
          aria-label="Issue metadata"
        >
          {/* Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
            <MinimalBadge kind="status" value={issue.status} />
          </div>

          <div className="h-3.5 w-px bg-border/60" aria-hidden="true" />

          {/* Priority */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Priority</span>
            <PriorityIndicator value={issue.priority} />
          </div>

          <div className="h-3.5 w-px bg-border/60" aria-hidden="true" />

          {/* Severity */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Severity</span>
            <MinimalBadge kind="severity" value={issue.severity} />
          </div>

          <div className="h-3.5 w-px bg-border/60" aria-hidden="true" />

          {/* Assignee */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Assignee</span>
            {assigneeName ? (
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold uppercase text-muted-foreground border border-border/50"
                >
                  {assigneeName[0]}
                </span>
                {assigneeName}
              </span>
            ) : (
              <span className="flex items-center gap-1 italic text-muted-foreground/60">
                <UserCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Unassigned
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── 8 / 4 Two-Column Body ─────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">

        {/* ── Left column — main content ──────────────────────────────── */}
        <div className="space-y-4">

          {/* Description */}
          <Card className="overflow-hidden border-border/70 shadow-xs">
            <CardHeader className="border-b border-border/60 bg-muted/30 px-5 py-3">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Description &amp; Reproduction
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
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
              className="group flex items-center gap-3 rounded-lg border border-border/70 bg-card px-4 py-3 shadow-xs transition-all hover:border-border hover:shadow-sm"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40">
                <ArrowUpRight
                  className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors"
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  External Reference
                </p>
                <p className="mt-0.5 truncate font-mono text-xs text-blue-600 group-hover:underline dark:text-blue-400">
                  {issue.url}
                </p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" aria-hidden="true" />
            </a>
          )}

          {/* Source notes */}
          {issue.sourceNotes && (
            <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 px-4 py-3 dark:border-amber-800/30 dark:bg-amber-950/20">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Context Note
              </p>
              <p className="mt-1 text-sm text-foreground/80">{issue.sourceNotes}</p>
            </div>
          )}

          {/* Evidence */}
          <Card className="overflow-hidden border-border/70 shadow-xs">
            <CardHeader className="border-b border-border/60 bg-muted/30 px-5 py-3">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Evidence &amp; Attachments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <IssueEvidenceList
                screenshots={issue.screenshots}
                attachments={issue.attachments}
              />
            </CardContent>
          </Card>

          {/* ── Unified Activity & Discussion feed ─────────────────────── */}
          <Card className="overflow-hidden border-border/70 shadow-xs" id="activity-feed">
            <CardHeader className="border-b border-border/60 bg-muted/30 px-5 py-3">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Activity &amp; Discussion
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <ActivityFeed
                issueId={issue.id}
                comments={issue.comments}
                history={issue.history}
              />
            </CardContent>
          </Card>
        </div>

        {/* ── Right column — sticky sidebar ──────────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">

          {/* Tracking Snapshot */}
          <Card className="overflow-hidden border-border/70 shadow-xs">
            <CardHeader className="border-b border-border/60 bg-muted/30 px-4 py-3">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tracking Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <dl className="divide-y divide-border/50">
                <SidebarRow label="Issue ID">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {shortId(issue.id)}
                  </span>
                </SidebarRow>
                <SidebarRow label="Type">
                  <MinimalBadge kind="type" value={issue.type} />
                </SidebarRow>
                <SidebarRow label="Created">
                  <time
                    dateTime={new Date(issue.createdAt).toISOString()}
                    className="font-mono text-xs text-muted-foreground"
                  >
                    {formatAbsolute(issue.createdAt)}
                  </time>
                </SidebarRow>
                <SidebarRow label="Updated">
                  <time
                    dateTime={new Date(issue.updatedAt).toISOString()}
                    className="font-mono text-xs text-muted-foreground"
                  >
                    {formatAbsolute(issue.updatedAt)}
                  </time>
                </SidebarRow>
                <SidebarRow label="Access">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3 shrink-0" aria-hidden="true" />
                    CASL Enforced
                  </span>
                </SidebarRow>
              </dl>
            </CardContent>
          </Card>

          {/* People & Ownership */}
          <Card className="overflow-hidden border-border/70 shadow-xs">
            <CardHeader className="border-b border-border/60 bg-muted/30 px-4 py-3">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                People
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <dl className="divide-y divide-border/50">
                <SidebarRow label="Reporter">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <span
                      aria-hidden="true"
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border/50 bg-muted text-[9px] font-bold uppercase text-muted-foreground"
                    >
                      {reporterName[0]?.toUpperCase()}
                    </span>
                    <span className="truncate max-w-[120px]">{reporterName}</span>
                  </span>
                </SidebarRow>
                <SidebarRow label="Assignee">
                  {assigneeName ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <span
                        aria-hidden="true"
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border/50 bg-muted text-[9px] font-bold uppercase text-muted-foreground"
                      >
                        {assigneeName[0]?.toUpperCase()}
                      </span>
                      <span className="truncate max-w-[120px]">{assigneeName}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs italic text-muted-foreground/60">
                      <UserCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Unassigned
                    </span>
                  )}
                </SidebarRow>
              </dl>
            </CardContent>
          </Card>

          {/* Quick State Actions — replaces isolated bottom action bar */}
          {(canEdit || canDelete) && (
            <SidebarActions
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
          )}

          {/* Back */}
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/tasks">← Back to Tasks</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}

// ─── SidebarRow ───────────────────────────────────────────────────────────────

function SidebarRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <dt className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="flex min-w-0 justify-end">{children}</dd>
    </div>
  );
}
