import type { ComponentType } from "react";
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  Circle,
  CircleDot,
  CircleSlash,
  Gauge,
  ListChecks,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type IssuePriority = "LOW" | "MEDIUM" | "HIGH";
type IssueSeverity = "MINOR" | "MAJOR" | "CRITICAL";
type IssueType = "BUG" | "IMPROVEMENT";

type Kind = "status" | "priority" | "severity" | "type";

type BadgeMeta = {
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  className: string;
};

const STATUS_META: Record<IssueStatus, BadgeMeta> = {
  OPEN: {
    label: "Open",
    icon: Circle,
    className: "border-amber-300/70 bg-amber-100/75 text-amber-900 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-200",
  },
  IN_PROGRESS: {
    label: "In progress",
    icon: CircleDot,
    className: "border-yellow-400/70 bg-yellow-100/80 text-yellow-900 dark:border-yellow-300/45 dark:bg-yellow-300/15 dark:text-yellow-200",
  },
  RESOLVED: {
    label: "Resolved",
    icon: CheckCircle2,
    className: "border-emerald-300/70 bg-emerald-100/75 text-emerald-900 dark:border-emerald-400/45 dark:bg-emerald-300/15 dark:text-emerald-200",
  },
  CLOSED: {
    label: "Closed",
    icon: CircleSlash,
    className: "border-slate-300/70 bg-slate-100/80 text-slate-800 dark:border-slate-400/45 dark:bg-slate-300/10 dark:text-slate-200",
  },
};

const PRIORITY_META: Record<IssuePriority, BadgeMeta> = {
  LOW: {
    label: "Low",
    icon: ListChecks,
    className: "border-slate-300/75 bg-slate-100/80 text-slate-800 dark:border-slate-400/45 dark:bg-slate-300/10 dark:text-slate-200",
  },
  MEDIUM: {
    label: "Medium",
    icon: Gauge,
    className: "border-zinc-300/75 bg-zinc-100/80 text-zinc-900 dark:border-zinc-400/45 dark:bg-zinc-300/10 dark:text-zinc-200",
  },
  HIGH: {
    label: "High",
    icon: AlertTriangle,
    className: "border-rose-300/75 bg-rose-100/80 text-rose-900 dark:border-rose-400/45 dark:bg-rose-300/15 dark:text-rose-200",
  },
};

const SEVERITY_META: Record<IssueSeverity, BadgeMeta> = {
  MINOR: {
    label: "Minor",
    icon: Circle,
    className: "border-sky-300/75 bg-sky-100/80 text-sky-900 dark:border-sky-400/45 dark:bg-sky-300/15 dark:text-sky-200",
  },
  MAJOR: {
    label: "Major",
    icon: Gauge,
    className: "border-amber-300/75 bg-amber-100/80 text-amber-900 dark:border-amber-400/45 dark:bg-amber-300/15 dark:text-amber-200",
  },
  CRITICAL: {
    label: "Critical",
    icon: AlertTriangle,
    className: "border-red-300/75 bg-red-100/80 text-red-900 dark:border-red-400/45 dark:bg-red-300/15 dark:text-red-200",
  },
};

const TYPE_META: Record<IssueType, BadgeMeta> = {
  BUG: {
    label: "Bug",
    icon: Bug,
    className: "border-rose-300/75 bg-rose-100/80 text-rose-900 dark:border-rose-400/45 dark:bg-rose-300/15 dark:text-rose-200",
  },
  IMPROVEMENT: {
    label: "Improvement",
    icon: Sparkles,
    className: "border-blue-300/75 bg-blue-100/80 text-blue-900 dark:border-blue-400/45 dark:bg-blue-300/15 dark:text-blue-200",
  },
};

function getMeta(kind: Kind, value: string): BadgeMeta {
  if (kind === "status") {
    return STATUS_META[(value as IssueStatus) ?? "OPEN"] ?? STATUS_META.OPEN;
  }
  if (kind === "priority") {
    return PRIORITY_META[(value as IssuePriority) ?? "LOW"] ?? PRIORITY_META.LOW;
  }
  if (kind === "severity") {
    return SEVERITY_META[(value as IssueSeverity) ?? "MINOR"] ?? SEVERITY_META.MINOR;
  }
  return TYPE_META[(value as IssueType) ?? "IMPROVEMENT"] ?? TYPE_META.IMPROVEMENT;
}

export function IssueSemanticBadge({
  kind,
  value,
  className,
}: {
  kind: Kind;
  value: string;
  className?: string;
}) {
  const meta = getMeta(kind, value);
  const Icon = meta.icon;
  const showIcon = kind === "status" || kind === "type";

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        meta.className,
        className,
      )}
    >
      {showIcon ? <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden={true} /> : null}
      {meta.label}
    </Badge>
  );
}
