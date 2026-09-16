/**
 * DashboardPage — Server Component
 *
 * Architecture change vs. the previous version:
 *
 *   Before:
 *     Server Component → renders <DashboardCharts /> (995-line "use client")
 *     The client fetches all data (stats + charts) via useEffect after hydration.
 *     Users see a "Loading charts..." spinner until the client fetch completes.
 *
 *   After:
 *     Server Component fetches the five KPI counts in one Promise.all.
 *     <StatsGrid> renders them synchronously — zero client JS, streams instantly.
 *     <DashboardCharts> is wrapped in <Suspense> and lazy-loaded only when the
 *     browser needs to display the chart canvases. The loading.tsx skeleton
 *     covers the whole page; the Suspense fallback covers just the charts section.
 *
 * Bundle impact:
 *   Chart.js (~200KB gzipped) is never shipped until the user hits /dashboard.
 *   StatsGrid has zero JS weight — it is pure HTML from the server.
 */

import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsGrid, type DashboardStats } from "@/app/(main)/dashboard/stats-grid";
import DashboardCharts from "@/app/(main)/dashboard/dashboard-charts";

// ── Charts section skeleton — shown while DashboardCharts hydrates ──────────

function ChartsSkeleton() {
  return (
    <section aria-label="Loading analytics charts" aria-busy="true" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-28" />
      </div>
      {/* Filter toolbar placeholder */}
      <Skeleton className="h-12 w-full rounded-xl" />
      {/* Three doughnut charts */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-[280px] w-full rounded-xl" />
        <Skeleton className="h-[280px] w-full rounded-xl" />
        <Skeleton className="h-[280px] w-full rounded-xl" />
      </div>
      {/* Bar chart */}
      <Skeleton className="h-[280px] w-full rounded-xl" />
      {/* Line chart */}
      <Skeleton className="h-[280px] w-full rounded-xl" />
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getAppSession();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";

  // ── Server-side stat counts ──────────────────────────────────────────────
  // Single DB round-trip: five COUNT queries parallelised in Promise.all.
  // These numbers arrive with the HTML — no client fetch, no spinner.
  const scopeFilter = isAdmin
    ? {}
    : {
        OR: [
          { createdBy: session.user.id },
          { assigneeId: session.user.id },
        ],
      };

  const [total, open, inProgress, resolved, closed] = await Promise.all([
    prisma.issue.count({ where: scopeFilter }),
    prisma.issue.count({ where: { ...scopeFilter, status: "OPEN" } }),
    prisma.issue.count({ where: { ...scopeFilter, status: "IN_PROGRESS" } }),
    prisma.issue.count({ where: { ...scopeFilter, status: "RESOLVED" } }),
    prisma.issue.count({ where: { ...scopeFilter, status: "CLOSED" } }),
  ]);

  const stats: DashboardStats = { total, open, inProgress, resolved, closed };

  return (
    <div className="page-stack">
      <PageHeader
        title="Dashboard"
        description={
          isAdmin
            ? "Track task activity, status, and trends across the full workspace."
            : "Track activity, status, and trends for your assigned and created issues."
        }
      />

      {/* Non-admin context banner */}
      {!isAdmin ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Personal workspace view</CardTitle>
            <CardDescription>
              This dashboard reflects issues you created or are assigned to.
              Admin dashboards include workspace-wide data.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild variant="outline" size="sm">
              <Link href="/tasks">Open my tasks</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/*
        StatsGrid: pure Server Component, zero JS.
        Renders synchronously from server-fetched numbers — users see the KPI
        cards the instant the HTML arrives, before any JS parses.
      */}
      <StatsGrid stats={stats} />

      {/*
        DashboardCharts: Client Component, wrapped in Suspense.
        The ChartsSkeleton is shown while React streams the component boundary
        and the browser downloads/executes the Chart.js bundle. This isolates
        the JS-heavy chart layer from the fast-path stats render above.
      */}
      <Suspense fallback={<ChartsSkeleton />}>
        <DashboardCharts />
      </Suspense>
    </div>
  );
}
