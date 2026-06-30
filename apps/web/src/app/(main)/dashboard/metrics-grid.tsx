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
    tone: "text-primary",
    strip: "bg-primary",
    getVal: (d: MetricsGridProps) => d.totalIssues,
  },
  {
    key: "open",
    label: "Open",
    href: "/tasks/filter?status=OPEN",
    Icon: CircleDot,
    tone: "text-amber-500 dark:text-amber-400",
    strip: "bg-amber-400",
    getVal: (d: MetricsGridProps) => d.open,
  },
  {
    key: "inProgress",
    label: "In progress",
    href: "/tasks/filter?status=IN_PROGRESS",
    Icon: LoaderCircle,
    tone: "text-blue-500 dark:text-blue-400",
    strip: "bg-blue-500",
    getVal: (d: MetricsGridProps) => d.inProgress,
  },
  {
    key: "resolved",
    label: "Resolved",
    href: "/tasks/filter?status=RESOLVED",
    Icon: BadgeCheck,
    tone: "text-emerald-600 dark:text-emerald-400",
    strip: "bg-emerald-500",
    getVal: (d: MetricsGridProps) => d.resolved,
  },
  {
    key: "closed",
    label: "Closed",
    href: "/tasks/filter?status=CLOSED",
    Icon: CheckCircle2,
    tone: "text-slate-500 dark:text-slate-400",
    strip: "bg-slate-400",
    getVal: (d: MetricsGridProps) => d.closed,
  },
];

export function MetricsGrid(props: MetricsGridProps) {
  return (
    <section className="space-y-2" aria-label="Issue metrics">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground/90">
          Performance Snapshot
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-5">
        {METRICS.map(({ key, label, href, Icon, tone, strip, getVal }) => (
          <Link key={key} href={href}>
            <Card className="group relative h-full cursor-pointer overflow-hidden bg-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-ring/50 dark:bg-card">
              <div
                className={`absolute left-0 top-0 h-full w-[3px] ${strip}`}
                aria-hidden="true"
              />
              <CardContent className="flex items-center justify-between gap-2.5 py-2.5 pl-4 pr-2.5">
                <div>
                  <p className="text-[12px] font-medium text-muted-foreground">
                    {label}
                  </p>
                  <p className={`text-xl font-semibold leading-tight ${tone}`}>
                    {getVal(props)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground">
                    View issues →
                  </p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground/80 transition-colors group-hover:bg-muted">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
