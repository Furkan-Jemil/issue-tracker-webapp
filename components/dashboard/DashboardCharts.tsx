"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { SlidersHorizontal, ArrowUpRight } from "lucide-react";
import {
  Ticket,
  CircleDot,
  LoaderCircle,
  BadgeCheck,
  CheckCircle2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";

const Line = dynamic(() => import("react-chartjs-2").then((mod) => mod.Line), {
  ssr: false,
});
const Bar = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), {
  ssr: false,
});
const Doughnut = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.Doughnut),
  { ssr: false },
);

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
);

type DashboardData = {
  totalIssues: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  low: number;
  medium: number;
  high: number;
  minor: number;
  major: number;
  critical: number;
  trend: {
    labels: string[];
    datasets: Array<{ label: string; data: number[] }>;
  };
  recentIssues: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    creator?: { name?: string; email?: string } | null;
  }>;
};

type TimelinePoint = {
  date: Date | null;
  label: string;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
};

type BucketSummary = {
  label: string;
  open: number;
  closed: number;
};

const SHADCN_CHART_COLORS = {
  total: "hsl(210 66% 70%)",
  open: "hsl(214 74% 62%)",
  inProgress: "hsl(216 83% 56%)",
  resolved: "hsl(225 73% 48%)",
  closed: "hsl(230 68% 42%)",
  openSoft: "hsl(214 74% 62% / 0.22)",
  inProgressSoft: "hsl(216 83% 56% / 0.2)",
} as const;

function getThemeColor(variableName: string, alpha?: number) {
  if (typeof window === "undefined") return "";
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
  if (!value) return "";
  return alpha === undefined ? `hsl(${value})` : `hsl(${value} / ${alpha})`;
}

function resolveColor(variableName: string, fallback: string, alpha?: number) {
  return getThemeColor(variableName, alpha) || fallback;
}

function formatChartDate(date: Date | null) {
  if (!date) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatBucketRange(start: Date | null, end: Date | null) {
  if (!start) return "";
  if (!end || start.getTime() === end.getTime()) return formatChartDate(start);
  return `${formatChartDate(start)} - ${formatChartDate(end)}`;
}

function buildComparisonBuckets(points: TimelinePoint[]) {
  if (points.length === 0) return [] as BucketSummary[];

  const bucketCount = Math.min(6, Math.max(3, Math.ceil(points.length / 7)));
  const bucketSize = Math.max(1, Math.ceil(points.length / bucketCount));
  const buckets: BucketSummary[] = [];

  for (let index = 0; index < points.length; index += bucketSize) {
    const chunk = points.slice(index, index + bucketSize);
    if (!chunk.length) continue;

    buckets.push({
      label: formatBucketRange(chunk[0].date, chunk[chunk.length - 1].date),
      open: chunk.reduce((sum, point) => sum + point.open, 0),
      closed: chunk.reduce((sum, point) => sum + point.closed, 0),
    });
  }

  return buckets;
}

export default function DashboardCharts() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [timeRange, setTimeRange] = useState("30d");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasActiveFilters = Boolean(
    statusFilter || priorityFilter || severityFilter,
  );

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () =>
      setThemeMode(root.classList.contains("dark") ? "dark" : "light");
    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const chartColors = useMemo(
    () => ({
      total: SHADCN_CHART_COLORS.total,
      open: SHADCN_CHART_COLORS.open,
      inProgress: SHADCN_CHART_COLORS.inProgress,
      resolved: SHADCN_CHART_COLORS.resolved,
      closed: SHADCN_CHART_COLORS.closed,
      low: SHADCN_CHART_COLORS.open,
      medium: SHADCN_CHART_COLORS.inProgress,
      high: SHADCN_CHART_COLORS.resolved,
      openSoft: SHADCN_CHART_COLORS.openSoft,
      inProgressSoft: SHADCN_CHART_COLORS.inProgressSoft,
    }),
    [],
  );

  const uiColors = useMemo(() => {
    const isDark = themeMode === "dark";
    return {
      legendText: resolveColor("--muted-foreground", "hsl(215 16% 42%)"),
      axisText: resolveColor("--muted-foreground", "hsl(215 16% 42%)"),
      tooltipBg: isDark
        ? "hsl(222 30% 8% / 0.96)"
        : resolveColor("--popover", "hsl(0 0% 100%)"),
      tooltipText: isDark
        ? "hsl(210 20% 97%)"
        : resolveColor("--popover-foreground", "hsl(222 47% 11%)"),
      tooltipBorder: isDark
        ? "hsl(218 22% 32% / 0.9)"
        : resolveColor("--border", "hsl(214 24% 88%)"),
      grid: resolveColor("--border", "hsl(214 24% 88%)", isDark ? 0.5 : 0.55),
    };
  }, [themeMode]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.append("status", statusFilter);
    if (priorityFilter) params.append("priority", priorityFilter);
    if (severityFilter) params.append("severity", severityFilter);
    if (timeRange) params.append("range", timeRange);

    setLoading(true);
    setError(null);

    fetch(`/api/dashboard/stats?${params.toString()}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload?.error || "Failed to load dashboard stats");
        return payload as DashboardData;
      })
      .then((payload) => {
        setData(payload);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setData(null);
        setLoading(false);
      });
  }, [statusFilter, priorityFilter, severityFilter, timeRange]);

  const timelinePoints = useMemo<TimelinePoint[]>(() => {
    if (!data?.trend) return [];

    const datasetLookup = new Map<string, number[]>(
      data.trend.datasets.map((set) => [set.label.toLowerCase(), set.data]),
    );

    return data.trend.labels.map((label, index) => {
      const parsed = new Date(label);
      const date = Number.isNaN(parsed.getTime()) ? null : parsed;

      return {
        date,
        label: date ? formatChartDate(date) : label.slice(5),
        open: datasetLookup.get("open")?.[index] ?? 0,
        inProgress: datasetLookup.get("in progress")?.[index] ?? 0,
        resolved: datasetLookup.get("resolved")?.[index] ?? 0,
        closed: datasetLookup.get("closed")?.[index] ?? 0,
      };
    });
  }, [data]);

  const trendData = useMemo(
    () => ({
      labels: timelinePoints.map((point) => point.label),
      datasets: [
        {
          label: "Open",
          data: timelinePoints.map((point) => point.open),
          borderColor: chartColors.open,
          backgroundColor: chartColors.openSoft,
          fill: true,
          tension: 0.38,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
        },
        {
          label: "In Progress",
          data: timelinePoints.map((point) => point.inProgress),
          borderColor: chartColors.inProgress,
          backgroundColor: chartColors.inProgressSoft,
          fill: true,
          tension: 0.38,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
        },
      ],
    }),
    [
      chartColors.inProgress,
      chartColors.inProgressSoft,
      chartColors.open,
      chartColors.openSoft,
      timelinePoints,
    ],
  );

  const comparisonBuckets = useMemo(
    () => buildComparisonBuckets(timelinePoints),
    [timelinePoints],
  );

  const comparisonData = useMemo(
    () => ({
      labels: comparisonBuckets.map((bucket) => bucket.label),
      datasets: [
        {
          label: "Open",
          data: comparisonBuckets.map((bucket) => bucket.open),
          backgroundColor: chartColors.open,
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 14,
        },
        {
          label: "Closed",
          data: comparisonBuckets.map((bucket) => bucket.closed),
          backgroundColor: chartColors.closed,
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 14,
        },
      ],
    }),
    [chartColors.closed, chartColors.open, comparisonBuckets],
  );

  const statusData = useMemo(
    () => ({
      labels: ["Open", "In Progress", "Resolved", "Closed"],
      datasets: [
        {
          label: "Status mix",
          data: data
            ? [data.open, data.inProgress, data.resolved, data.closed]
            : [],
          backgroundColor: [
            chartColors.open,
            chartColors.inProgress,
            chartColors.resolved,
            chartColors.closed,
          ],
          borderWidth: 0,
          borderRadius: 10,
          hoverOffset: 4,
          spacing: 2,
          offset: [14, 0, 0, 0],
        },
      ],
    }),
    [
      chartColors.closed,
      chartColors.inProgress,
      chartColors.open,
      chartColors.resolved,
      data,
    ],
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Loading charts...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          No data available.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground/90">
            Performance Snapshot
          </h2>
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 text-[11px] font-medium">
            Live data
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 xl:grid-cols-5">
          {[
            {
              href: "/issues",
              label: "Total issues",
              value: data.totalIssues,
              icon: Ticket,
              tone: "text-primary",
            },
            {
              href: "/issues/filter?status=OPEN",
              label: "Open",
              value: data.open,
              icon: CircleDot,
              tone: "text-[hsl(var(--chart-1))]",
            },
            {
              href: "/issues/filter?status=IN_PROGRESS",
              label: "In progress",
              value: data.inProgress,
              icon: LoaderCircle,
              tone: "text-[hsl(var(--chart-2))]",
            },
            {
              href: "/issues/filter?status=RESOLVED",
              label: "Resolved",
              value: data.resolved,
              icon: BadgeCheck,
              tone: "text-[hsl(var(--chart-3))]",
            },
            {
              href: "/issues/filter?status=CLOSED",
              label: "Closed",
              value: data.closed,
              icon: CheckCircle2,
              tone: "text-[hsl(var(--chart-5))]",
            },
          ].map(({ href, label, value, icon: Icon, tone }) => (
            <Link key={label} href={href}>
              <Card className="group h-full cursor-pointer border-border/70 bg-card/95 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg focus-within:ring-2 focus-within:ring-ring/50">
                <CardContent className="flex items-center justify-between gap-3 p-3">
                  <div>
                    <p className="text-[12px] font-medium text-muted-foreground">
                      {label}
                    </p>
                    <p
                      className={`text-2xl font-semibold leading-tight ${tone}`}>
                      {value}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground">
                      Open list
                    </p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-gradient-to-br from-background to-muted/25 text-muted-foreground">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-9 rounded-full p-0"
          aria-label="Toggle dashboard filters"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((current) => !current)}>
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Badge
          variant="outline"
          className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
          {timeRange}
        </Badge>
      </div>

      {filtersOpen && (
        <Card className="border-border/70 bg-card/95">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Filters
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              disabled={!hasActiveFilters}
              onClick={() => {
                setStatusFilter("");
                setPriorityFilter("");
                setSeverityFilter("");
              }}>
              Clear
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-2">
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </Select>
            <Select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}>
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>
            <Select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value)}>
              <option value="">All Severities</option>
              <option value="MINOR">Minor</option>
              <option value="MAJOR">Major</option>
              <option value="CRITICAL">Critical</option>
            </Select>
            <Select
              value={timeRange}
              onChange={(event) => setTimeRange(event.target.value)}>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="365d">Last year</option>
            </Select>
          </CardContent>
        </Card>
      )}

      <section className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground/90">
            Analytics
          </h2>
          <p className="text-xs text-muted-foreground">
            Trend, mix, and throughput
          </p>
        </div>

        <div className="grid gap-3">
          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  Issue Trend
                </CardTitle>
                <CardDescription>
                  Open and in-progress issues across the selected range.
                </CardDescription>
              </div>
              <Select
                value={timeRange}
                onChange={(event) => setTimeRange(event.target.value)}
                className="w-36">
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="365d">Last year</option>
              </Select>
            </CardHeader>
            <CardContent className="h-[clamp(190px,26vh,240px)] p-3">
              <Line
                key={`trend-${themeMode}`}
                data={trendData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: { duration: 220, easing: "easeOutCubic" },
                  interaction: { mode: "index", intersect: false },
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        usePointStyle: true,
                        pointStyle: "rectRounded",
                        boxWidth: 10,
                        boxHeight: 10,
                        padding: 12,
                        font: { size: 11, weight: 600 },
                        color: uiColors.legendText,
                      },
                    },
                    tooltip: {
                      backgroundColor: uiColors.tooltipBg,
                      titleColor: uiColors.tooltipText,
                      bodyColor: uiColors.tooltipText,
                      padding: 12,
                      cornerRadius: 10,
                      borderColor: uiColors.tooltipBorder,
                      borderWidth: 1,
                      displayColors: true,
                      callbacks: {
                        labelTextColor: () => uiColors.tooltipText,
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                        font: { size: 11 },
                        color: uiColors.axisText,
                      },
                      grid: { color: uiColors.grid },
                      border: { display: false },
                    },
                    x: {
                      grid: { display: false },
                      ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 8,
                        font: { size: 11 },
                        color: uiColors.axisText,
                      },
                      border: { display: false },
                    },
                  },
                  elements: {
                    line: { borderCapStyle: "round", borderJoinStyle: "round" },
                    point: { radius: 0, hoverRadius: 4 },
                  },
                }}
              />
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-3">
              <CardTitle className="text-base font-semibold">
                Status Mix
              </CardTitle>
              <CardDescription>
                Current issue distribution by workflow state.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 p-3">
              <div className="mx-auto h-[190px] w-full max-w-[220px]">
                <Doughnut
                  key={`status-${themeMode}`}
                  data={statusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 220, easing: "easeOutCubic" },
                    cutout: "66%",
                    rotation: -90,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          usePointStyle: true,
                          pointStyle: "rectRounded",
                          boxWidth: 10,
                          boxHeight: 10,
                          padding: 10,
                          font: { size: 11, weight: 600 },
                          color: uiColors.legendText,
                        },
                      },
                      tooltip: {
                        backgroundColor: uiColors.tooltipBg,
                        titleColor: uiColors.tooltipText,
                        bodyColor: uiColors.tooltipText,
                        borderColor: uiColors.tooltipBorder,
                        borderWidth: 1,
                        callbacks: {
                          labelTextColor: () => uiColors.tooltipText,
                          label: (context) =>
                            `${context.label}: ${context.raw}`,
                        },
                      },
                    },
                  }}
                />
              </div>
              <div className="border-t border-border/60 pt-2 text-center">
                <p className="text-sm font-medium text-foreground">
                  Trending up by 5.2% this month
                </p>
                <p className="text-xs text-muted-foreground">
                  Showing total status distribution for the selected range.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-3">
              <CardTitle className="text-base font-semibold">
                Monthly Comparison
              </CardTitle>
              <CardDescription>
                Open versus closed issue volume by grouped date buckets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 p-3">
              <div className="h-[clamp(170px,23vh,220px)]">
            <Bar
              key={`comparison-${themeMode}`}
              data={comparisonData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 220, easing: "easeOutCubic" },
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      usePointStyle: true,
                      pointStyle: "rectRounded",
                      boxWidth: 10,
                      boxHeight: 10,
                      padding: 12,
                      font: { size: 11, weight: 600 },
                      color: uiColors.legendText,
                    },
                  },
                  tooltip: {
                    backgroundColor: uiColors.tooltipBg,
                    titleColor: uiColors.tooltipText,
                    bodyColor: uiColors.tooltipText,
                    padding: 12,
                    cornerRadius: 10,
                    borderColor: uiColors.tooltipBorder,
                    borderWidth: 1,
                    callbacks: {
                      labelTextColor: () => uiColors.tooltipText,
                    },
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: {
                      maxRotation: 0,
                      autoSkip: true,
                      maxTicksLimit: 6,
                      font: { size: 11 },
                      color: uiColors.axisText,
                    },
                    border: { display: false },
                  },
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0,
                      font: { size: 11 },
                      color: uiColors.axisText,
                    },
                    grid: { color: uiColors.grid },
                    border: { display: false },
                  },
                },
              }}
            />
              </div>
              <div className="border-t border-border/60 pt-2 text-center">
                <p className="text-sm font-medium text-foreground">
                  Trending up by 5.2% this month
                </p>
                <p className="text-xs text-muted-foreground">
                  Showing grouped issue throughput for the last 6 intervals.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base font-semibold text-foreground/90">
            <span>Recent Issues</span>
            <Link
              href="/issues"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
              View all
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.recentIssues?.slice(0, 4).map((issue) => (
              <li key={issue.id}>
                <Link
                  href={`/issues/${issue.id}`}
                  className="block rounded-lg border border-border/70 bg-background/70 p-3 transition hover:border-border hover:bg-background">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-primary hover:underline">
                      {issue.title}
                    </span>
                    <Badge variant="outline">{issue.status}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {issue.creator?.name ||
                      issue.creator?.email ||
                      "Unknown reporter"}
                  </div>
                  <div className="mt-2">
                    <Badge variant="secondary">
                      Priority: {issue.priority}
                    </Badge>
                  </div>
                </Link>
              </li>
            ))}
            {(!data.recentIssues || data.recentIssues.length === 0) && (
              <li className="text-sm text-muted-foreground">
                No recent issues found.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
