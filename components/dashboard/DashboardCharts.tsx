"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bar, Doughnut, Line } from "react-chartjs-2";
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
import { SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

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

  const chartGridColor = "rgba(148, 163, 184, 0.16)";

  const fallbackChartColors = {
    total: "hsl(221 83% 53%)",
    open: "hsl(221 83% 53%)",
    inProgress: "hsl(214 95% 68%)",
    resolved: "hsl(217 91% 60%)",
    closed: "hsl(224 76% 48%)",
    low: "hsl(221 83% 53%)",
    medium: "hsl(214 95% 68%)",
    high: "hsl(217 91% 60%)",
  };

  function getThemeColor(variableName: string, alpha?: number) {
    if (typeof window === "undefined") return "";
    const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
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
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [severityFilter, setSeverityFilter] = useState("");
    const [timeRange, setTimeRange] = useState("30d");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const hasActiveFilters = Boolean(statusFilter || priorityFilter || severityFilter);

    const chartColors = {
      total: resolveColor("--chart-4", fallbackChartColors.total),
      open: resolveColor("--chart-1", fallbackChartColors.open),
      inProgress: resolveColor("--chart-2", fallbackChartColors.inProgress),
      resolved: resolveColor("--chart-3", fallbackChartColors.resolved),
      closed: resolveColor("--chart-5", fallbackChartColors.closed),
      low: resolveColor("--chart-1", fallbackChartColors.low),
      medium: resolveColor("--chart-2", fallbackChartColors.medium),
      high: resolveColor("--chart-3", fallbackChartColors.high),
      openSoft: resolveColor("--chart-1", fallbackChartColors.open, 0.16),
      inProgressSoft: resolveColor("--chart-2", fallbackChartColors.inProgress, 0.16),
      closedSoft: resolveColor("--chart-5", fallbackChartColors.closed, 0.16),
    };

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
          if (!response.ok) throw new Error(payload?.error || "Failed to load dashboard stats");
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
      [chartColors.inProgress, chartColors.inProgressSoft, chartColors.open, chartColors.openSoft, timelinePoints],
    );

    const comparisonBuckets = useMemo(() => buildComparisonBuckets(timelinePoints), [timelinePoints]);

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
            data: data ? [data.open, data.inProgress, data.resolved, data.closed] : [],
            backgroundColor: [chartColors.open, chartColors.inProgress, chartColors.resolved, chartColors.closed],
            borderWidth: 0,
            hoverOffset: 4,
            spacing: 2,
          },
        ],
      }),
      [chartColors.closed, chartColors.inProgress, chartColors.open, chartColors.resolved, data],
    );

    if (loading) {
      return (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">Loading charts...</CardContent>
        </Card>
      );
    }

    if (error) {
      return (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      );
    }

    if (!data) {
      return (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">No data available.</CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <Link href="/issues">
            <Card className="h-full border-border/70 bg-card/95 transition hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-3">
                <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Total issues</p>
                <p className="text-lg font-semibold leading-tight text-foreground">{data.totalIssues}</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/issues/filter?status=OPEN">
            <Card className="h-full border-border/70 bg-card/95 transition hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-3">
                <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Open</p>
                <p className="text-lg font-semibold leading-tight text-[hsl(var(--chart-1))]">{data.open}</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/issues/filter?status=IN_PROGRESS">
            <Card className="h-full border-border/70 bg-card/95 transition hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-3">
                <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">In progress</p>
                <p className="text-lg font-semibold leading-tight text-[hsl(var(--chart-2))]">{data.inProgress}</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/issues/filter?status=RESOLVED">
            <Card className="h-full border-border/70 bg-card/95 transition hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-3">
                <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Resolved</p>
                <p className="text-lg font-semibold leading-tight text-[hsl(var(--chart-3))]">{data.resolved}</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/issues/filter?status=CLOSED">
            <Card className="h-full border-border/70 bg-card/95 transition hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-3">
                <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Closed</p>
                <p className="text-lg font-semibold leading-tight text-[hsl(var(--chart-5))]">{data.closed}</p>
              </CardContent>
            </Card>
          </Link>
        </div>

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
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
            {timeRange}
          </Badge>
        </div>

        {filtersOpen && (
          <Card className="border-border/70 bg-card/95">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Filters</CardTitle>
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
              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </Select>
              <Select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </Select>
              <Select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
                <option value="">All Severities</option>
                <option value="MINOR">Minor</option>
                <option value="MAJOR">Major</option>
                <option value="CRITICAL">Critical</option>
              </Select>
              <Select value={timeRange} onChange={(event) => setTimeRange(event.target.value)}>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="365d">Last year</option>
              </Select>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Analytics</p>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div>
                  <CardTitle className="text-base font-semibold">Issue Trend</CardTitle>
                  <CardDescription>Open and in-progress issues across the selected range.</CardDescription>
                </div>
                <Select value={timeRange} onChange={(event) => setTimeRange(event.target.value)} className="w-36">
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="365d">Last year</option>
                </Select>
              </CardHeader>
              <CardContent className="h-[360px] p-4">
                <Line
                  data={trendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: "index", intersect: false },
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          usePointStyle: true,
                          pointStyle: "line",
                          boxWidth: 18,
                          boxHeight: 3,
                          padding: 18,
                          font: { size: 11, weight: 600 },
                          color: "hsl(var(--muted-foreground))",
                        },
                      },
                      tooltip: {
                        backgroundColor: "hsl(var(--popover))",
                        titleColor: "hsl(var(--popover-foreground))",
                        bodyColor: "hsl(var(--popover-foreground))",
                        padding: 12,
                        cornerRadius: 10,
                        borderColor: "hsl(var(--border))",
                        borderWidth: 1,
                        displayColors: true,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { precision: 0, font: { size: 11 } },
                        grid: { color: chartGridColor },
                        border: { display: false },
                      },
                      x: {
                        grid: { display: false },
                        ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8, font: { size: 11 } },
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
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="text-base font-semibold">Status Mix</CardTitle>
                <CardDescription>Current issue distribution by workflow state.</CardDescription>
              </CardHeader>
              <CardContent className="flex h-[360px] items-center justify-center p-4">
                <div className="h-[270px] w-full">
                  <Doughnut
                    data={statusData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: "72%",
                      rotation: -90,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            usePointStyle: true,
                            pointStyle: "circle",
                            padding: 14,
                            font: { size: 11, weight: 600 },
                            color: "hsl(var(--muted-foreground))",
                          },
                        },
                        tooltip: {
                          backgroundColor: "hsl(var(--popover))",
                          titleColor: "hsl(var(--popover-foreground))",
                          bodyColor: "hsl(var(--popover-foreground))",
                          borderColor: "hsl(var(--border))",
                          borderWidth: 1,
                          callbacks: {
                            label: (context) => `${context.label}: ${context.raw}`,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-base font-semibold">Monthly Comparison</CardTitle>
              <CardDescription>Open and closed issue volume grouped into shadcn-style buckets.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] p-4">
              <Bar
                data={comparisonData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 14,
                        font: { size: 11, weight: 600 },
                        color: "hsl(var(--muted-foreground))",
                      },
                    },
                    tooltip: {
                      backgroundColor: "hsl(var(--popover))",
                      titleColor: "hsl(var(--popover-foreground))",
                      bodyColor: "hsl(var(--popover-foreground))",
                      padding: 12,
                      cornerRadius: 10,
                      borderColor: "hsl(var(--border))",
                      borderWidth: 1,
                    },
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { maxRotation: 0, autoSkip: false, font: { size: 11 } },
                      border: { display: false },
                    },
                    y: {
                      beginAtZero: true,
                      ticks: { precision: 0, font: { size: 11 } },
                      grid: { color: chartGridColor },
                      border: { display: false },
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Recent Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.recentIssues?.slice(0, 4).map((issue) => (
                <li key={issue.id}>
                  <Link
                    href={`/issues/${issue.id}`}
                    className="block rounded-lg border border-border/70 bg-background/70 p-3 transition hover:border-border hover:bg-background"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-primary hover:underline">{issue.title}</span>
                      <Badge variant="outline">{issue.status}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {issue.creator?.name || issue.creator?.email || "Unknown reporter"}
                    </div>
                    <div className="mt-2">
                      <Badge variant="secondary">Priority: {issue.priority}</Badge>
                    </div>
                  </Link>
                </li>
              ))}
              {(!data.recentIssues || data.recentIssues.length === 0) && (
                <li className="text-sm text-muted-foreground">No recent issues found.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }
