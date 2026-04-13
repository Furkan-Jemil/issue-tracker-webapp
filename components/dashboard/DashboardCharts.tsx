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

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const palette = {
  open: "hsl(221 83% 53%)",
  inProgress: "hsl(173 58% 39%)",
  resolved: "hsl(221 39% 11%)",
  closed: "hsl(215 16% 47%)",
  low: "hsl(221 83% 53%)",
  medium: "hsl(173 58% 39%)",
  high: "hsl(262 62% 58%)",
};

const chartGridColor = "rgba(100, 116, 139, 0.2)";
const fallbackChartColors = {
  total: "hsl(221 83% 53%)",
  open: "hsl(221 83% 53%)",
  inProgress: "hsl(173 58% 39%)",
  resolved: "hsl(262 62% 58%)",
  closed: "hsl(215 16% 47%)",
  low: "hsl(221 83% 53%)",
  medium: "hsl(173 58% 39%)",
  high: "hsl(262 62% 58%)",
};

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
    low: resolveColor("--chart-2", fallbackChartColors.low),
    medium: resolveColor("--chart-3", fallbackChartColors.medium),
    high: resolveColor("--chart-5", fallbackChartColors.high),
    openSoft: resolveColor("--chart-1", fallbackChartColors.open, 0.14),
    inProgressSoft: resolveColor("--chart-2", fallbackChartColors.inProgress, 0.14),
    resolvedSoft: resolveColor("--chart-3", fallbackChartColors.resolved, 0.14),
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
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error || "Failed to load dashboard stats");
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

  const statusData = useMemo(
    () => ({
      labels: ["Issues"],
      datasets: [
        {
          label: "Open",
          data: data ? [data.open] : [],
          backgroundColor: chartColors.open,
          borderRadius: 999,
          borderSkipped: false,
          barThickness: 12,
          stack: "status",
        },
        {
          label: "In Progress",
          data: data ? [data.inProgress] : [],
          backgroundColor: chartColors.inProgress,
          borderRadius: 999,
          borderSkipped: false,
          barThickness: 12,
          stack: "status",
        },
        {
          label: "Resolved",
          data: data ? [data.resolved] : [],
          backgroundColor: chartColors.resolved,
          borderRadius: 999,
          borderSkipped: false,
          barThickness: 12,
          stack: "status",
        },
        {
          label: "Closed",
          data: data ? [data.closed] : [],
          backgroundColor: chartColors.closed,
          borderRadius: 999,
          borderSkipped: false,
          barThickness: 12,
          stack: "status",
        },
      ],
    }),
    [data],
  );

  const priorityData = useMemo(
    () => ({
      labels: ["Low", "Medium", "High"],
      datasets: [
        {
          label: "Priority mix",
          data: data ? [data.low, data.medium, data.high] : [],
          backgroundColor: [chartColors.low, chartColors.medium, chartColors.high],
          borderColor: "hsl(var(--card))",
          borderWidth: 4,
          hoverOffset: 8,
        },
      ],
    }),
    [data],
  );

  const trendData = useMemo(() => {
    if (!data?.trend) {
      return { labels: [], datasets: [] };
    }

    const byLabel = new Map(
      data.trend.datasets.map((set) => [set.label.toLowerCase(), set.data]),
    );

    return {
      labels: data.trend.labels.map((label) => {
        const parsed = new Date(label);
        if (Number.isNaN(parsed.getTime())) return label.slice(5);
        return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      }),
      datasets: [
        {
          label: "Open",
          data: byLabel.get("open") ?? [],
          borderColor: chartColors.open,
          backgroundColor: chartColors.openSoft,
          fill: true,
          tension: 0.32,
        },
        {
          label: "In Progress",
          data: byLabel.get("in progress") ?? [],
          borderColor: chartColors.inProgress,
          backgroundColor: chartColors.inProgressSoft,
          fill: true,
          tension: 0.32,
        },
        {
          label: "Resolved",
          data: byLabel.get("resolved") ?? [],
          borderColor: chartColors.resolved,
          backgroundColor: chartColors.resolvedSoft,
          fill: true,
          tension: 0.32,
        },
      ],
    };
  }, [data]);

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
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </Select>
            <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>
            <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
              <option value="">All Severities</option>
              <option value="MINOR">Minor</option>
              <option value="MAJOR">Major</option>
              <option value="CRITICAL">Critical</option>
            </Select>
            <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="365d">Last year</option>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/70 bg-card/95">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Analytics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 p-3 md:grid-cols-5">
          <div className="md:col-span-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Issue Trend</p>
            <div className="h-[220px] rounded-xl border border-border/60 bg-background/60 p-3">
              <Line
                data={trendData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top",
                      align: "start",
                      labels: {
                        usePointStyle: true,
                        pointStyle: "line",
                        boxWidth: 20,
                        boxHeight: 3,
                        padding: 16,
                        font: { size: 11, weight: 600 },
                      },
                    },
                    tooltip: {
                      backgroundColor: "hsl(var(--popover))",
                      titleColor: "hsl(var(--popover-foreground))",
                      bodyColor: "hsl(var(--popover-foreground))",
                      padding: 10,
                      cornerRadius: 10,
                      borderColor: "hsl(var(--border))",
                      borderWidth: 1,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { precision: 0, font: { size: 11 } },
                      grid: { color: chartGridColor },
                    },
                    x: {
                      grid: { display: false },
                      ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 7, font: { size: 11 } },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="space-y-3 md:col-span-2">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Priority Mix</p>
              <div className="h-[220px] rounded-xl border border-border/60 bg-background/60 p-3">
                <Doughnut
                  data={priorityData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "68%",
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          usePointStyle: true,
                          pointStyle: "circle",
                          padding: 14,
                          font: { size: 11, weight: 600 },
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
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[96px] p-3">
          <Bar
            data={statusData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: "y",
              plugins: {
                legend: {
                  display: true,
                  position: "bottom",
                  labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    padding: 8,
                    font: { size: 10, weight: 600 },
                  },
                },
              },
              scales: {
                x: { stacked: true, beginAtZero: true, ticks: { display: false }, grid: { display: false } },
                y: { stacked: true, ticks: { display: false }, grid: { display: false } },
              },
            }}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Recent Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.recentIssues?.slice(0, 4).map((issue) => (
              <li key={issue.id}>
                <Link href={`/issues/${issue.id}`} className="block rounded-lg border border-border/70 bg-background/70 p-3 transition hover:border-border hover:bg-background">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-primary hover:underline">
                      {issue.title}
                    </span>
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
