"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { GripVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IssueSemanticBadge } from "@/components/issue/IssueSemanticBadge";
import { changeIssueStatusQuick } from "@/app/issues/quick-actions";
import { StatusQuickActions } from "@/app/issues/StatusQuickActions";
import { cn } from "@/lib/utils";

type BoardStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

type BoardIssue = {
  id: string;
  title: string;
  type: string;
  priority: string;
  severity: string;
  status: BoardStatus;
  createdAt: string;
  assigneeId: string | null;
};

type DropTarget = {
  status: BoardStatus;
  index: number;
};

type MoveResult = {
  previous: Record<BoardStatus, BoardIssue[]>;
  next: Record<BoardStatus, BoardIssue[]>;
  statusChanged: boolean;
  issueId: string;
  nextStatus: BoardStatus;
};

const STATUS_ORDER: BoardStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const BOARD_STORAGE_KEY = "issues-board-order-v1";

function statusVariant(status: BoardStatus) {
  if (status === "OPEN") return "warning" as const;
  if (status === "IN_PROGRESS") return "secondary" as const;
  if (status === "RESOLVED") return "success" as const;
  return "outline" as const;
}

function statusLabel(status: BoardStatus) {
  if (status === "IN_PROGRESS") return "In Progress";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatDate(d: string): string {
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

function buildColumns(issues: BoardIssue[]) {
  return {
    OPEN: issues.filter((issue) => issue.status === "OPEN"),
    IN_PROGRESS: issues.filter((issue) => issue.status === "IN_PROGRESS"),
    RESOLVED: issues.filter((issue) => issue.status === "RESOLVED"),
    CLOSED: issues.filter((issue) => issue.status === "CLOSED"),
  } satisfies Record<BoardStatus, BoardIssue[]>;
}

function withPersistedOrder(columns: Record<BoardStatus, BoardIssue[]>) {
  if (typeof window === "undefined") return columns;

  const raw = window.localStorage.getItem(BOARD_STORAGE_KEY);
  if (!raw) return columns;

  let ids: unknown;
  try {
    ids = JSON.parse(raw);
  } catch {
    return columns;
  }
  if (!Array.isArray(ids)) return columns;

  const rank = new Map<string, number>();
  ids.forEach((id, idx) => {
    if (typeof id === "string") rank.set(id, idx);
  });

  const sorted = { ...columns } as Record<BoardStatus, BoardIssue[]>;
  STATUS_ORDER.forEach((status) => {
    sorted[status] = [...columns[status]].sort((a, b) => {
      const aRank = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const bRank = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      if (aRank !== bRank) return aRank - bRank;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  });

  return sorted;
}

function persistOrder(columns: Record<BoardStatus, BoardIssue[]>) {
  if (typeof window === "undefined") return;

  const flat = STATUS_ORDER.flatMap((status) => columns[status].map((issue) => issue.id));
  window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(flat));
}

function applyMove(
  columns: Record<BoardStatus, BoardIssue[]>,
  issueId: string,
  toStatus: BoardStatus,
  toIndex?: number,
): MoveResult | null {
  let fromStatus: BoardStatus | null = null;
  let fromIndex = -1;

  for (const status of STATUS_ORDER) {
    const idx = columns[status].findIndex((issue) => issue.id === issueId);
    if (idx >= 0) {
      fromStatus = status;
      fromIndex = idx;
      break;
    }
  }

  if (!fromStatus || fromIndex < 0) return null;

  const previous = {
    OPEN: [...columns.OPEN],
    IN_PROGRESS: [...columns.IN_PROGRESS],
    RESOLVED: [...columns.RESOLVED],
    CLOSED: [...columns.CLOSED],
  };

  const next = {
    OPEN: [...columns.OPEN],
    IN_PROGRESS: [...columns.IN_PROGRESS],
    RESOLVED: [...columns.RESOLVED],
    CLOSED: [...columns.CLOSED],
  };

  const [moved] = next[fromStatus].splice(fromIndex, 1);
  if (!moved) return null;

  const targetList = next[toStatus];
  let desiredIndex =
    typeof toIndex === "number"
      ? Math.max(0, Math.min(toIndex, targetList.length))
      : 0;

  if (fromStatus === toStatus && fromIndex < desiredIndex) {
    desiredIndex -= 1;
  }

  targetList.splice(desiredIndex, 0, {
    ...moved,
    status: toStatus,
  });

  return {
    previous,
    next,
    statusChanged: fromStatus !== toStatus,
    issueId,
    nextStatus: toStatus,
  };
}

export function IssuesBoard({
  issues,
  assigneeLabelById,
  canManageStatus,
}: {
  issues: BoardIssue[];
  assigneeLabelById: Record<string, string>;
  canManageStatus: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [columns, setColumns] = useState<Record<BoardStatus, BoardIssue[]>>(() => buildColumns(issues));

  useEffect(() => {
    setColumns(withPersistedOrder(buildColumns(issues)));
  }, [issues]);

  useEffect(() => {
    persistOrder(columns);
  }, [columns]);

  const totals = useMemo(
    () => ({
      OPEN: columns.OPEN.length,
      IN_PROGRESS: columns.IN_PROGRESS.length,
      RESOLVED: columns.RESOLVED.length,
      CLOSED: columns.CLOSED.length,
    }),
    [columns],
  );

  function getDraggingIssueId(event?: { dataTransfer?: DataTransfer | null }) {
    if (draggingIdRef.current) return draggingIdRef.current;
    const dataId = event?.dataTransfer?.getData("text/plain");
    if (dataId) return dataId;
    return draggingId;
  }

  function commitMove(issueId: string, toStatus: BoardStatus, toIndex?: number) {
    const result = applyMove(columns, issueId, toStatus, toIndex);
    if (!result) return;

    setColumns(result.next);

    if (!result.statusChanged) return;

    startTransition(async () => {
      try {
        await changeIssueStatusQuick(result.issueId, result.nextStatus);
      } catch {
        setColumns(result.previous);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
        Drag cards to any lane and exact position (top, middle, bottom). Status updates are applied immediately.
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {STATUS_ORDER.map((status) => {
          const items = columns[status];
          const canDrop = canManageStatus && Boolean(draggingId);

          return (
            <section key={status} className="rounded-2xl border border-border/70 bg-muted/20 p-3">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{statusLabel(status)}</h2>
                  <p className="text-xs text-muted-foreground">{totals[status]} issues</p>
                </div>
                <Badge variant={statusVariant(status)}>{status}</Badge>
              </div>

              <div className="space-y-2">
                {canDrop ? (
                  <div
                    onDragEnter={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setDropTarget({ status, index: 0 });
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setDropTarget({ status, index: 0 });
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      const issueId = getDraggingIssueId(event);
                      if (!issueId) return;
                      commitMove(issueId, status, 0);
                      draggingIdRef.current = null;
                      setDraggingId(null);
                      setDropTarget(null);
                    }}
                    className={cn(
                      "h-2 rounded-md border border-dashed transition",
                      dropTarget?.status === status && dropTarget?.index === 0
                        ? "border-primary bg-primary/20"
                        : "border-transparent",
                    )}
                  />
                ) : null}

                {items.length === 0 ? (
                  <div
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setDropTarget({ status, index: 0 });
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      const issueId = getDraggingIssueId(event);
                      if (!issueId) return;
                      commitMove(issueId, status, 0);
                      draggingIdRef.current = null;
                      setDraggingId(null);
                      setDropTarget(null);
                    }}
                    className="rounded-xl border border-dashed border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                    No issues in this lane.
                  </div>
                ) : (
                  items.map((issue, index) => {
                    return (
                      <div
                        key={issue.id}
                        className="space-y-2"
                        onDragOver={(event) => {
                          if (!canManageStatus) return;
                          event.preventDefault();
                          event.stopPropagation();
                          setDropTarget({ status, index });
                        }}
                        onDrop={(event) => {
                          if (!canManageStatus) return;
                          event.preventDefault();
                          event.stopPropagation();
                          const issueId = getDraggingIssueId(event);
                          if (!issueId) return;
                          commitMove(issueId, status, index);
                          draggingIdRef.current = null;
                          setDraggingId(null);
                          setDropTarget(null);
                        }}>
                        <Card
                          draggable={canManageStatus}
                          onDragStart={(event) => {
                            if (!canManageStatus) return;
                            draggingIdRef.current = issue.id;
                            setDraggingId(issue.id);
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", issue.id);
                          }}
                          onDragEnd={() => {
                            draggingIdRef.current = null;
                            setDraggingId(null);
                            setDropTarget(null);
                          }}
                          density="dense"
                          className={cn(
                            "border-border/70 bg-card/95",
                            canManageStatus && "cursor-grab active:cursor-grabbing",
                            draggingId === issue.id && "opacity-60",
                          )}>
                          <CardContent className="space-y-2 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <IssueSemanticBadge kind="status" value={issue.status} />
                                  <IssueSemanticBadge kind="priority" value={issue.priority} />
                                </div>
                                <Link href={`/issues/${issue.id}`} className="font-semibold leading-snug text-primary hover:underline">
                                  {issue.title}
                                </Link>
                              </div>
                              {canManageStatus ? (
                                <div className="flex items-center gap-1">
                                  <GripVertical className="h-4 w-4 text-muted-foreground/70" aria-hidden="true" />
                                  <StatusQuickActions
                                    issueId={issue.id}
                                    currentStatus={issue.status}
                                    editHref={`/issues/${issue.id}#edit-section`}
                                  />
                                </div>
                              ) : null}
                            </div>

                            <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                              <IssueSemanticBadge kind="type" value={issue.type} />
                              <IssueSemanticBadge kind="severity" value={issue.severity} />
                              <span className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px]">
                                Assignee: {issue.assigneeId ? assigneeLabelById[issue.assigneeId] || "Unknown" : "Unassigned"}
                              </span>
                            </div>

                            <p className="text-xs text-muted-foreground">Created {formatDate(issue.createdAt)}</p>
                          </CardContent>
                        </Card>

                        {canDrop ? (
                          <div
                            onDragEnter={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setDropTarget({ status, index: index + 1 });
                            }}
                            onDragOver={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setDropTarget({ status, index: index + 1 });
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              const issueId = getDraggingIssueId(event);
                              if (!issueId) return;
                              commitMove(issueId, status, index + 1);
                              draggingIdRef.current = null;
                              setDraggingId(null);
                              setDropTarget(null);
                            }}
                            className={cn(
                              "h-2 rounded-md border border-dashed transition",
                              dropTarget?.status === status && dropTarget?.index === index + 1
                                ? "border-primary bg-primary/20"
                                : "border-transparent",
                            )}
                          />
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
