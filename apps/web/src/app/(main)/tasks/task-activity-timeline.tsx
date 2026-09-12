/**
 * TaskActivityTimeline
 *
 * Replaces the unstyled activity log card on /tasks/[task-id].
 *
 * Design:
 *   - Vertical connector line runs through all events (CSS border-left on
 *     the list item container, not a separate element, so it aligns
 *     precisely with the icon centres regardless of text height).
 *   - Each event type has a distinct icon, icon background colour, and a
 *     subtle left-border accent on the card body.
 *   - Metadata (previous → next status, priority changes) is extracted from
 *     the JSON `metadata` field and rendered as an inline diff pill.
 *   - Timestamps use formatRelative() for recency and a full absolute date
 *     in the <time> title attribute for precision.
 *   - Empty state matches the dashed-border pattern used elsewhere in the app.
 *
 * This is a pure Server Component — it receives pre-fetched history rows from
 * the parent page and has no client-side state.
 */

import {
  AlertTriangle,
  ArrowRight,
  Bug,
  CheckCircle2,
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

type HistoryEntry = {
  id: string;
  eventType: string;
  description: string;
  createdAt: Date | string;
  metadata?: Record<string, unknown> | null;
  actor?: { name: string | null } | null;
};

// ─── Event config map ──────────────────────────────────────────────────────────

type EventConfig = {
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** Tailwind classes for the icon wrapper circle */
  iconBg: string;
  /** Tailwind text colour for the icon itself */
  iconColor: string;
  /** Tailwind left-border colour on the event card */
  borderAccent: string;
  /** Human-readable label used in the sr-only event type span */
  label: string;
};

const EVENT_CONFIG: Record<HistoryEvent, EventConfig> = {
  CREATED: {
    Icon: Plus,
    iconBg: "bg-emerald-100 dark:bg-emerald-400/20",
    iconColor: "text-emerald-700 dark:text-emerald-300",
    borderAccent: "border-l-emerald-400/70 dark:border-l-emerald-500/50",
    label: "Created",
  },
  STATUS_CHANGED: {
    Icon: RefreshCw,
    iconBg: "bg-blue-100 dark:bg-blue-400/20",
    iconColor: "text-blue-700 dark:text-blue-300",
    borderAccent: "border-l-blue-400/70 dark:border-l-blue-500/50",
    label: "Status changed",
  },
  UPDATED: {
    Icon: Pencil,
    iconBg: "bg-amber-100 dark:bg-amber-400/20",
    iconColor: "text-amber-700 dark:text-amber-300",
    borderAccent: "border-l-amber-400/70 dark:border-l-amber-500/50",
    label: "Updated",
  },
  COMMENTED: {
    Icon: MessageSquare,
    iconBg: "bg-slate-100 dark:bg-slate-400/20",
    iconColor: "text-slate-600 dark:text-slate-300",
    borderAccent: "border-l-slate-300/70 dark:border-l-slate-500/50",
    label: "Comment added",
  },
};

const FALLBACK_CONFIG: EventConfig = {
  Icon: Clock,
  iconBg: "bg-muted/60",
  iconColor: "text-muted-foreground",
  borderAccent: "border-l-border/50",
  label: "Activity",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getConfig(eventType: string): EventConfig {
  return EVENT_CONFIG[eventType as HistoryEvent] ?? FALLBACK_CONFIG;
}

/**
 * Extracts previous→next metadata from a STATUS_CHANGED history entry.
 * Returns null if the metadata is absent or malformed.
 */
function extractStatusDiff(
  metadata: Record<string, unknown> | null | undefined,
): { from: string; to: string } | null {
  if (!metadata) return null;
  const from =
    typeof metadata.previousStatus === "string" ? metadata.previousStatus : null;
  const to =
    typeof metadata.newStatus === "string" ? metadata.newStatus : null;
  if (!from || !to) return null;
  return { from, to };
}

/**
 * Humanises a SCREAMING_SNAKE status token for display.
 * "IN_PROGRESS" → "In progress"
 */
function humaniseStatus(s: string): string {
  if (s === "IN_PROGRESS") return "In progress";
  return s.charAt(0) + s.slice(1).toLowerCase();
}

// ─── StatusDiffPill ────────────────────────────────────────────────────────────

function StatusDiffPill({ from, to }: { from: string; to: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground">
      <span className="text-muted-foreground">{humaniseStatus(from)}</span>
      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/60" aria-hidden="true" />
      <span className="font-semibold">{humaniseStatus(to)}</span>
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
      <div className="rounded-lg border border-dashed border-border/70 bg-background/60 px-4 py-6 text-center text-sm text-muted-foreground">
        No activity recorded yet.
      </div>
    );
  }

  return (
    <ol
      aria-label="Issue activity timeline"
      className="relative space-y-0"
    >
      {history.map((entry, idx) => {
        const cfg = getConfig(entry.eventType);
        const { Icon } = cfg;
        const isLast = idx === history.length - 1;
        const statusDiff =
          entry.eventType === "STATUS_CHANGED"
            ? extractStatusDiff(
                entry.metadata as Record<string, unknown> | null,
              )
            : null;

        const actorName = entry.actor?.name || "System";
        const relativeTime = formatRelative(entry.createdAt);
        const absoluteTime = formatAbsolute(entry.createdAt);

        return (
          <li
            key={entry.id}
            className={cn(
              "relative flex gap-3 pb-5",
              // Vertical connector line — pseudo-element via border on the
              // wrapper. Invisible for the last item.
              !isLast &&
                "before:absolute before:left-[15px] before:top-8 before:h-[calc(100%-1.5rem)] before:w-px before:bg-border/60",
            )}
          >
            {/* ── Icon column ────────────────────────────────────────────── */}
            <div
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                cfg.iconBg,
              )}
              aria-hidden="true"
            >
              <Icon className={cn("h-3.5 w-3.5", cfg.iconColor)} aria-hidden="true" />
            </div>

            {/* ── Event card ─────────────────────────────────────────────── */}
            <div
              className={cn(
                "min-w-0 flex-1 rounded-lg border border-border/60 border-l-4 bg-background px-3 py-2.5",
                cfg.borderAccent,
              )}
            >
              {/* Header row: event type label + relative time */}
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Screen-reader event type */}
                  <span className="sr-only">{cfg.label}:</span>

                  {/* Visible event label */}
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {cfg.label}
                  </span>

                  {/* Status diff pill — only for STATUS_CHANGED */}
                  {statusDiff ? (
                    <StatusDiffPill from={statusDiff.from} to={statusDiff.to} />
                  ) : null}
                </div>

                {/* Relative timestamp */}
                <time
                  dateTime={new Date(entry.createdAt).toISOString()}
                  title={absoluteTime}
                  className="shrink-0 text-[11px] text-muted-foreground/80"
                >
                  {relativeTime}
                </time>
              </div>

              {/* Description */}
              <p className="mt-1 text-sm leading-relaxed text-foreground/85">
                {entry.description}
              </p>

              {/* Actor */}
              <div className="mt-1.5 flex items-center gap-1.5">
                <User
                  className="h-3 w-3 shrink-0 text-muted-foreground/60"
                  aria-hidden="true"
                />
                <span className="text-[11px] text-muted-foreground">
                  {actorName}
                </span>
                {/* Absolute timestamp as secondary context */}
                <span className="text-[11px] text-muted-foreground/50" aria-hidden="true">
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
