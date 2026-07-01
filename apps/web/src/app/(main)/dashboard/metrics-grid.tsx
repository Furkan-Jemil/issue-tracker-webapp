import Link from "next/link";
import {
  Ticket,
  CircleDot,
  LoaderCircle,
  BadgeCheck,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type MetricsGridProps = {
  totalIssues: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
};

const METRICS = [
  {
    key: "total",
    label: "Total tasks",
    href: "/tasks",
    Icon: Ticket,
    tone: "text-[hsl(var(--color-in-progress))]",
    strip: "bg-[hsl(var(--color-in-progress))]",
    wide: true,
    getVal: (d: MetricsGridProps) => d.totalIssues,
  },
  {
    key: "open",
    label: "Open",
    href: "/tasks?status=OPEN",
    Icon: CircleDot,
    tone: "text-[hsl(var(--color-open))]",
    strip: "bg-[hsl(var(--color-open))]",
    wide: false,
    getVal: (d: MetricsGridProps) => d.open,
  },
  {
    key: "inProgress",
    label: "In Progress",
    href: "/tasks?status=IN_PROGRESS",
    Icon: LoaderCircle,
    tone: "text-[hsl(var(--color-in-progress))]",
    strip: "bg-[hsl(var(--color-in-progress))]",
    wide: false,
    getVal: (d: MetricsGridProps) => d.inProgress,
  },
  {
    key: "resolved",
    label: "Resolved",
    href: "/tasks?status=RESOLVED",
    Icon: BadgeCheck,
    tone: "text-[hsl(var(--color-resolved))]",
    strip: "bg-[hsl(var(--color-resolved))]",
    wide: false,
    getVal: (d: MetricsGridProps) => d.resolved,
  },
  {
    key: "closed",
    label: "Closed",
    href: "/tasks?status=CLOSED",
    Icon: CheckCircle2,
    tone: "text-[hsl(var(--color-closed))]",
    strip: "bg-[hsl(var(--color-closed))]",
    wide: false,
    getVal: (d: MetricsGridProps) => d.closed,
  },
];

export function MetricsGrid(props: MetricsGridProps) {
  return (
    <section aria-label="Issue metrics">
      {/*
       * Layout logic:
       *  Mobile  (< sm):  Total = full width; 2-col grid for the 4 status cards
       *  Tablet  (sm–lg): Total = col-span-2 wide banner; 2 + 2 below
       *  Desktop (≥ xl):  All 5 in a single row
       */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-5">
        {METRICS.map(({ key, label, href, Icon, tone, strip, wide, getVal }) => (
          <Link
            key={key}
            href={href}
            className={wide ? "col-span-2 sm:col-span-4 xl:col-span-1" : "col-span-1"}
          >
            <Card className="group relative h-full cursor-pointer overflow-hidden bg-card shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-ring/50">
              {/* Left-border color strip */}
              <div
                className={`absolute left-0 top-0 h-full w-[3px] ${strip}`}
                aria-hidden="true"
              />
              <CardContent className="flex items-center justify-between gap-3 py-3 pl-4 pr-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className={`mt-0.5 text-2xl font-bold leading-tight tabular-nums ${tone}`}>
                    {getVal(props)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/70 transition-colors group-hover:text-muted-foreground">
                    View issues →
                  </p>
                </div>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors group-hover:bg-muted ${strip} bg-opacity-10`}>
                  <Icon className={`h-4 w-4 ${tone}`} aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
