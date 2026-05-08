"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
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
import { Ticket, CircleDot, LoaderCircle, BadgeCheck, CheckCircle2, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  startDate: Date | null;
  endDate: Date | null;
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
      startDate: chunk[0].date,
      endDate: chunk[chunk.length - 1].date,
      open: chunk.reduce((sum, point) => sum + point.open, 0),
      closed: chunk.reduce((sum, point) => sum + point.closed, 0),
    });
  }

  return buckets;
}

export default function DashboardCharts() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [draftStatusFilter, setDraftStatusFilter] = useState("");
  const [draftPriorityFilter, setDraftPriorityFilter] = useState("");
  const [draftSeverityFilter, setDraftSeverityFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("30d");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPanelRef = useRef<HTMLDivElement | null>(null);
  const hasActiveFilters = Boolean(statusFilter || priorityFilter || severityFilter);
  const activeFilterCount = [statusFilter, priorityFilter, severityFilter].filter(Boolean).length;
  const hasDraftFilters = Boolean(
    draftStatusFilter || draftPriorityFilter || draftSeverityFilter,
  );
  const hasPendingFilterChanges =
    draftStatusFilter !== statusFilter ||
    draftPriorityFilter !== priorityFilter ||
    draftSeverityFilter !== severityFilter;

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!filtersOpen) return;
      const target = event.target as Node | null;
      if (target && target instanceof Element && target.closest('[data-select-content="true"]')) {
        return;
      }
      if (
        target &&
        filtersPanelRef.current &&
        !filtersPanelRef.current.contains(target)
      ) {
        setFiltersOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFiltersOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [filtersOpen]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed.length === 0) {
        setSearchQuery("");
        return;
      }
      if (trimmed.length >= 2) {
        setSearchQuery(trimmed);
      }
    }, 320);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  function openFiltersPanel() {
    setDraftStatusFilter(statusFilter);
    setDraftPriorityFilter(priorityFilter);
    setDraftSeverityFilter(severityFilter);
    setFiltersOpen(true);
  }

  function applyDraftFilters() {
    setStatusFilter(draftStatusFilter);
    setPriorityFilter(draftPriorityFilter);
    setSeverityFilter(draftSeverityFilter);
    setFiltersOpen(false);
  }

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
    if (searchQuery) params.append("q", searchQuery);
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
  }, [statusFilter, priorityFilter, severityFilter, searchQuery, timeRange]);

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

  function navigateToIssuesWithFilters(filters: {
    status?: string;
    priority?: string;
    severity?: string;
    createdFrom?: Date | null;
    createdTo?: Date | null;
  }) {
    const params = new URLSearchParams({ view: "details", page: "1" });

    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.severity) params.set("severity", filters.severity);
    if (filters.createdFrom) {
      params.set("createdFrom", filters.createdFrom.toISOString().slice(0, 10));
    }
    if (filters.createdTo) {
      params.set("createdTo", filters.createdTo.toISOString().slice(0, 10));
    }

    router.push(`/issues?${params.toString()}`);
  }

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

  const hasStatusMixData = useMemo(
    () =>
      Boolean(
        data &&
          [data.open, data.inProgress, data.resolved, data.closed].some(
            (value) => value > 0,
          ),
      ),
    [data],
  );

  const hasComparisonData = useMemo(
    () =>
      comparisonBuckets.some((bucket) => bucket.open > 0 || bucket.closed > 0),
    [comparisonBuckets],
  );

  const hasTrendData = useMemo(
    () =>
      timelinePoints.some(
        (point) => point.open > 0 || point.inProgress > 0,
      ),
    [timelinePoints],
  );

  const hasRecentIssues = (data?.recentIssues?.length ?? 0) > 0;

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
    <div className="space-y-3">
      <section className="space-y-2">
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
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-5">
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
              <Card className="group h-full cursor-pointer border-0 bg-card/70 shadow-none transition-colors duration-150 hover:bg-accent/20 focus-within:ring-2 focus-within:ring-ring/50">
                <CardContent className="flex items-center justify-between gap-2.5 p-2.5">
                  <div>
                    <p className="text-[12px] font-medium text-muted-foreground">
                      {label}
                    </p>
                    <p
                      className={`text-xl font-semibold leading-tight ${tone}`}>
                      {value}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground">
                      Open list
                    </p>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/80">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground/90">
            Analytics
          </h2>
          <span className="text-xs text-muted-foreground">Compact analytics view</span>
        </div>

        <div className="space-y-2">
          <div className="rounded-xl border border-border/70 bg-muted/20 p-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full max-w-[290px]">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search dashboard (type at least 2 letters)"
                aria-label="Search dashboard issues"
                className="h-8 rounded-md pl-8 pr-8 text-xs"
              />
              {searchInput ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearchInput("");
                    setSearchQuery("");
                  }}
                  aria-label="Clear search"
                  className="absolute right-0.5 top-1/2 h-6 w-6 -translate-y-1/2 rounded-md">
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              ) : null}
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div ref={filtersPanelRef} className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="relative h-8 w-8 rounded-md p-0"
                  aria-label="Toggle dashboard filters"
                  aria-expanded={filtersOpen}
                  aria-controls="dashboard-filters-popover"
                  onClick={() => {
                    if (filtersOpen) {
                      setFiltersOpen(false);
                      return;
                    }
                    openFiltersPanel();
                  }}>
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  {hasActiveFilters ? (
                    <span
                      aria-hidden="true"
                      className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </Button>

                {filtersOpen ? (
                  <Card id="dashboard-filters-popover" className="popover-surface absolute right-0 top-9 z-30 w-[min(88vw,220px)] border-border bg-card shadow-lg">
                  <CardContent className="space-y-1.5 p-2">
                    <Select
                      value={draftStatusFilter}
                      onValueChange={setDraftStatusFilter}
                      className="h-8 text-xs">
                      <option value="">All Statuses</option>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </Select>
                    <Select
                      value={draftPriorityFilter}
                      onValueChange={setDraftPriorityFilter}
                      className="h-8 text-xs">
                      <option value="">All Priorities</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </Select>
                    <Select
                      value={draftSeverityFilter}
                      onValueChange={setDraftSeverityFilter}
                      className="h-8 text-xs">
                      <option value="">All Severities</option>
                      <option value="MINOR">Minor</option>
                      <option value="MAJOR">Major</option>
                      <option value="CRITICAL">Critical</option>
                    </Select>
                    <div className="flex items-center justify-end gap-1.5 pt-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        disabled={!hasDraftFilters}
                        onClick={() => {
                          setDraftStatusFilter("");
                          setDraftPriorityFilter("");
                          setDraftSeverityFilter("");
                        }}>
                        Clear
                      </Button>
                      <Button
                        type="button"
                        size="dense"
                        className="h-7 px-2 text-xs"
                        disabled={!hasPendingFilterChanges}
                        onClick={applyDraftFilters}>
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                  </Card>
                ) : null}
              </div>
              <Select
                value={timeRange}
                onValueChange={setTimeRange}
                className="h-8 w-[124px] text-xs">
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
                <option value="90d">90 days</option>
                <option value="365d">1 year</option>
              </Select>
            </div>
            </div>
          </div>

          {hasStatusMixData || hasComparisonData ? (
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          {hasStatusMixData ? (
          <Card className="min-w-0 border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/60 pb-2.5">
              <CardTitle className="text-base font-semibold">
                Status Mix
              </CardTitle>
              <CardDescription className="text-xs">
                Current issue distribution by workflow state.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-2.5">
              <div className="mx-auto h-[190px] w-full max-w-[220px] lg:h-[210px] lg:max-w-[240px]">
                  <Doughnut
                    key={`status-${themeMode}`}
                    data={statusData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      animation: { duration: 220, easing: "easeOutCubic" },
                      cutout: "66%",
                      rotation: -90,
                      onClick: (_event, elements) => {
                        if (!elements.length) return;
                        const index = elements[0].index;
                        const label = statusData.labels[index];
                        const statusMap: Record<string, string> = {
                          Open: "OPEN",
                          "In Progress": "IN_PROGRESS",
                          Resolved: "RESOLVED",
                          Closed: "CLOSED",
                        };
                        navigateToIssuesWithFilters({ status: statusMap[label] });
                      },
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
          ) : null}
          {hasComparisonData ? (
          <Card className="min-w-0 border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/60 pb-2.5">
              <CardTitle className="text-base font-semibold">
                Monthly Comparison
              </CardTitle>
              <CardDescription className="text-xs">
                Open versus closed issue volume by grouped date buckets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-2.5">
              <div className="h-[190px] w-full lg:h-[210px]">
                  <Bar
                    key={`comparison-${themeMode}`}
                    data={comparisonData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      animation: { duration: 220, easing: "easeOutCubic" },
                      onClick: (_event, elements) => {
                        if (!elements.length) return;
                        const { datasetIndex, index } = elements[0];
                        const bucket = comparisonBuckets[index];
                        if (!bucket) return;
                        const status = datasetIndex === 0 ? "OPEN" : "CLOSED";
                        navigateToIssuesWithFilters({
                          status,
                          createdFrom: bucket.startDate,
                          createdTo: bucket.endDate,
                        });
                      },
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
          ) : null}
          </div>
          ) : null}
        </div>

        {hasTrendData ? (
        <Card className="min-w-0 border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/60 pb-2.5">
            <CardTitle className="text-base font-semibold">Issue Trend</CardTitle>
            <CardDescription className="text-xs">
              Open and in-progress issues across the selected range.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2.5">
            <div className="h-[210px] w-full lg:h-[230px]">
                <Line
                  key={`trend-${themeMode}`}
                  data={trendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 220, easing: "easeOutCubic" },
                    interaction: { mode: "index", intersect: false },
                    onClick: (_event, elements) => {
                      if (!elements.length) return;
                      const { datasetIndex, index } = elements[0];
                      const datasetLabel = trendData.datasets[datasetIndex]?.label;
                      const status = datasetLabel === "Open" ? "OPEN" : datasetLabel === "In Progress" ? "IN_PROGRESS" : undefined;
                      const point = timelinePoints[index];
                      navigateToIssuesWithFilters({
                        status,
                        createdFrom: point?.date ?? null,
                        createdTo: point?.date ?? null,
                      });
                    },
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
            </div>
          </CardContent>
        </Card>
        ) : null}
      </section>

      {/* Recent Issues removed per request - charts and graphs remain */}
    </div>
  );
}
