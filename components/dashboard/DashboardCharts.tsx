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
  open: "#1d4ed8",
  inProgress: "#0f766e",
  resolved: "#15803d",
  closed: "#64748b",
  low: "#0ea5e9",
  medium: "#f59e0b",
  high: "#dc2626",
};

const chartGridColor = "rgba(100, 116, 139, 0.2)";

export default function DashboardCharts() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [timeRange, setTimeRange] = useState("30d");
  const hasActiveFilters = Boolean(statusFilter || priorityFilter || severityFilter);

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
      labels: ["Open", "In Progress", "Resolved", "Closed"],
      datasets: [
        {
          label: "Issues",
          data: data ? [data.open, data.inProgress, data.resolved, data.closed] : [],
          backgroundColor: [palette.open, palette.inProgress, palette.resolved, palette.closed],
          borderRadius: 8,
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
          backgroundColor: [palette.low, palette.medium, palette.high],
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
          borderColor: palette.open,
          backgroundColor: "rgba(22, 163, 74, 0.16)",
          fill: true,
          tension: 0.32,
        },
        {
          label: "In Progress",
          data: byLabel.get("in progress") ?? [],
          borderColor: palette.inProgress,
          backgroundColor: "rgba(2, 132, 199, 0.12)",
          fill: true,
          tension: 0.32,
        },
        {
          label: "Resolved",
          data: byLabel.get("resolved") ?? [],
          borderColor: palette.resolved,
          backgroundColor: "rgba(15, 118, 110, 0.1)",
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
              <p className="text-xs text-muted-foreground">Total issues</p>
              <p className="text-2xl font-semibold leading-tight text-slate-900">{data.totalIssues}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/issues/filter?status=OPEN">
          <Card className="h-full border-border/70 bg-card/95 transition hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Open</p>
              <p className="text-2xl font-semibold leading-tight text-blue-700">{data.open}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/issues/filter?status=IN_PROGRESS">
          <Card className="h-full border-border/70 bg-card/95 transition hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">In progress</p>
              <p className="text-2xl font-semibold leading-tight text-teal-700">{data.inProgress}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/issues/filter?status=RESOLVED">
          <Card className="h-full border-border/70 bg-card/95 transition hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Resolved</p>
              <p className="text-2xl font-semibold leading-tight text-emerald-700">{data.resolved}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/issues/filter?status=CLOSED">
          <Card className="h-full border-border/70 bg-card/95 transition hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Closed</p>
              <p className="text-2xl font-semibold leading-tight text-slate-600">{data.closed}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card className="border-border/70 bg-card/95">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <Badge variant="outline">Range: {timeRange}</Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto]">
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
          <Button
            variant="ghost"
            className="justify-center"
            disabled={!hasActiveFilters}
            onClick={() => {
              setStatusFilter("");
              setPriorityFilter("");
              setSeverityFilter("");
            }}>
            Clear
          </Button>
          <Button
            variant="outline"
            className="justify-center"
            onClick={() => {
              if (!data) return;
              const byLabel = new Map(data.trend.datasets.map((set) => [set.label, set.data]));
              const csv = [
                ["Date", "Open", "In Progress", "Resolved", "Closed"].join(","),
                ...data.trend.labels.map((label, i) =>
                  [
                    label,
                    byLabel.get("Open")?.[i] ?? 0,
                    byLabel.get("In Progress")?.[i] ?? 0,
                    byLabel.get("Resolved")?.[i] ?? 0,
                    byLabel.get("Closed")?.[i] ?? 0,
                  ].join(","),
                ),
              ].join("\n");

              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "issue-trends.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}>
            Export CSV
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Analytics</CardTitle>
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
                      backgroundColor: "rgba(15, 23, 42, 0.94)",
                      padding: 10,
                      cornerRadius: 10,
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
          <CardTitle className="text-base">Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] p-3">
          <Bar
            data={statusData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, ticks: { precision: 0, font: { size: 11 } }, grid: { color: chartGridColor } },
                x: { grid: { display: false } },
              },
            }}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-base">Recent Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.recentIssues?.slice(0, 4).map((issue) => (
              <li key={issue.id} className="rounded-lg border border-border/70 bg-background/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/issues/${issue.id}`} className="font-semibold text-primary hover:underline">
                    {issue.title}
                  </Link>
                  <Badge variant="outline">{issue.status}</Badge>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {issue.creator?.name || issue.creator?.email || "Unknown reporter"}
                </div>
                <div className="mt-2">
                  <Badge variant="secondary">Priority: {issue.priority}</Badge>
                </div>
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
