/**
 * StatsGrid — pure Server Component
 *
 * Renders the five KPI stat cards on the dashboard. This component has zero
 * client-side JavaScript: it receives pre-fetched numbers from the parent RSC
 * (dashboard/page.tsx), renders synchronously, and streams to the browser
 * before any chart JS has been downloaded.
 *
 * The parent fetches counts in a single Promise.all so all five numbers
 * resolve in one DB round-trip.
 */

import Link from "next/link";
import {
  BadgeCheck,
  CheckCircle2,
  CircleDot,
  LoaderCircle,
  Ticket,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export type DashboardStats = {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
};

type StatCard = {
  label: string;
  value: number;
  /** /tasks URL with pre-applied filter so clicking navigates instantly */
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** Tailwind text colour class */
  tone: string;
};

function buildCards(stats: DashboardStats): StatCard[] {
  return [
    {
      label: "Total",
      value: stats.total,
      href: "/tasks",
      icon: Ticket,
      tone: "text-primary",
    },
    {
      label: "Open",
      value: stats.open,
      href: "/tasks?status=OPEN&view=details&page=1",
      icon: CircleDot,
      tone: "text-[hsl(var(--chart-1))]",
    },
    {
      label: "In progress",
      value: stats.inProgress,
      href: "/tasks?status=IN_PROGRESS&view=details&page=1",
      icon: LoaderCircle,
      tone: "text-[hsl(var(--chart-2))]",
    },
    {
      label: "Resolved",
      value: stats.resolved,
      href: "/tasks?status=RESOLVED&view=details&page=1",
      icon: BadgeCheck,
      tone: "text-[hsl(var(--chart-3))]",
    },
    {
      label: "Closed",
      value: stats.closed,
      href: "/tasks?status=CLOSED&view=details&page=1",
      icon: CheckCircle2,
      tone: "text-[hsl(var(--chart-5))]",
    },
  ];
}

export function StatsGrid({ stats }: { stats: DashboardStats }) {
  const cards = buildCards(stats);

  return (
    <section aria-label="Issue summary statistics">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground/90">
          Performance snapshot
        </h2>
        <Badge
          variant="outline"
          className="rounded-full px-3 py-1 text-xs font-medium"
        >
          Live
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map(({ label, value, href, icon: Icon, tone }) => (
          <Link key={label} href={href} className="group outline-none">
            <Card className="glass-card h-full cursor-pointer transition-colors duration-150 hover:bg-accent/20 focus-within:ring-2 focus-within:ring-ring/50">
              <CardContent className="flex items-center justify-between gap-2.5 p-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {label}
                  </p>
                  <p className={`mt-0.5 text-xl font-semibold leading-tight ${tone}`}>
                    {value.toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                    View list
                  </p>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
