/**
 * TaskActivityTimeline — Enterprise-grade vertical event log.
 *
 * Pure Server Component. Renders a chronological list of issue history events
 * with icon circles, left-border accent cards, and relative/absolute timestamps.
 *
 * All colour tokens are strict Tailwind zinc/slate design-system values.
 * No arbitrary colours.
 */

import {
  ArrowRight,
  Clock,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  User,
} from "lucide-react";

import { formatRelative, formatAbsolute } from "@/lib/formatRelative";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type HistoryEvent = "CREATED" | "STATUS_CHANGED" | "UPDATED" | "COMMENTED";

export type HistoryEntry = {
  id: string;
  eventType: string;
  description: string;
  createdAt: Date | string;
  metadata?: unknown;
  actor?: { name: string | null } | null;
};

type LucideIcon = React.ComponentType<{
  className?: string;
  "aria-hidden"?: boolean;
}>;

// ─── Event config ─────────────────────────────────────────────────────────────

type EventConfig = {
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  borderAccent: string;
  label: string;
};

const EVENT_CONFIG: Record<HistoryEvent, EventConfig> = {
  CREATED: {
    Icon: Plus,
    iconBg: "bg-zinc-100 dark:bg-zinc-800",
    iconColor: "text-zinc-600 dark:text-zinc-300",
    borderAccent: "border-l-zinc-400/60",
    label: "Created",
  },
  STATUS_CHANGED: {
    Icon: RefreshCw,
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-600 dark:text-slate-300",
    borderAccent: "border-l-slate-400/60",
    label: "Status changed",
  },
  UPDATED: {
    Icon: Pencil,
    iconBg: "bg-zinc-100 dark:bg-zinc-800",
    iconColor: "text-zinc-500 dark:text-zinc-400",
    borderAccent: "border-l-zinc-300/60",
    label: "Updated",
  },
  COMMENTED: {
    Icon: MessageSquare,
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    borderAccent: "border-l-border/60",
    label: "Comment added",
  },
};

const FALLBACK_CONFIG: EventConfig = {
  Icon: Clock,
  iconBg: "bg-muted",
  iconColor: "text-muted-foreground",
  borderAccent: "border-l-border/40",
  label: "Activity",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getConfig(eventType: string): EventConfig {
  return EVENT_CONFIG[eventType as HistoryEvent] ?? FALLBACK_CONFIG;
}

function extractStatusDiff(
  metadata: unknown,
): { from: string; to: string } | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const obj = metadata as Record<string, unknown>;
  const from =
    typeof obj.previousStatus === "string" ? obj.previousStatus : null;
  const to = typeof obj.newStatus === "string" ? obj.newStatus : null;
  if (!from || !to) return null;
  return { from, to };
}

function humaniseStatus(s: string): string {
  if (s === "IN_PROGRESS") return "In progress";
  return s.charAt(0) + s.slice(1).toLowerCase();
}

// ─── StatusDiffPill ───────────────────────────────────────────────────────────

function StatusDiffPill({ from, to }: { from: string; to: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground">
      <span className="text-muted-foreground">{humaniseStatus(from)}</span>
      <ArrowRight
        className="h-3 w-3 shrink-0 text-muted-foreground/50"
        aria-hidden
      />
      <span className="font-semibold text-foreground">
        {humaniseStatus(to)}
      </span>
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskActivityTimeline({
  history,
}: {
  history: HistoryEntry[];
}) {
  if (history.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/10 px-3 py-3 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden="true" />
        No activity recorded yet.
      </div>
    );
  }

  return (
    <ol aria-label="Issue activity timeline" className="relative space-y-0">
      {history.map((entry, idx) => {
        const cfg = getConfig(entry.eventType);
        const { Icon } = cfg;
        const isLast = idx === history.length - 1;

        const statusDiff =
          entry.eventType === "STATUS_CHANGED"
            ? extractStatusDiff(entry.metadata)
            : null;

        const actorName = entry.actor?.name ?? "System";
        const relativeTime = formatRelative(entry.createdAt);
        const absoluteTime = formatAbsolute(entry.createdAt);

        return (
          <li
            key={entry.id}
            className={cn(
              "relative flex gap-3 pb-4",
              // Vertical connector line between events
              !isLast &&
                "before:absolute before:left-[15px] before:top-8 before:h-[calc(100%-1.25rem)] before:w-px before:bg-border/50",
            )}
          >
            {/* Icon circle */}
            <div
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/40",
                cfg.iconBg,
              )}
              aria-hidden="true"
            >
              <Icon className={cn("h-3.5 w-3.5", cfg.iconColor)} aria-hidden />
            </div>

            {/* Event card */}
            <div
              className={cn(
                "min-w-0 flex-1 rounded-lg border border-border/50 border-l-[3px] bg-card px-3 py-2.5",
                cfg.borderAccent,
              )}
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {cfg.label}
                  </span>
                  {statusDiff && (
                    <StatusDiffPill
                      from={statusDiff.from}
                      to={statusDiff.to}
                    />
                  )}
                </div>
                <time
                  dateTime={new Date(entry.createdAt).toISOString()}
                  title={absoluteTime}
                  className="shrink-0 font-mono text-[10px] text-muted-foreground/70"
                >
                  {relativeTime}
                </time>
              </div>

              {/* Description */}
              <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                {entry.description}
              </p>

              {/* Actor + absolute stamp */}
              <div className="mt-1.5 flex items-center gap-1.5">
                <User
                  className="h-3 w-3 shrink-0 text-muted-foreground/50"
                  aria-hidden
                />
                <span className="text-[11px] text-muted-foreground">
                  {actorName}
                </span>
                <span
                  className="font-mono text-[10px] text-muted-foreground/50"
                  aria-hidden="true"
                >
                  · {absoluteTime}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
