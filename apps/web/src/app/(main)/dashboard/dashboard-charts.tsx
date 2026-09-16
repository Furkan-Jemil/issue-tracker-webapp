"use client";

/**
 * DashboardCharts — isolated Client Component
 *
 * Responsibilities narrowed vs. the previous 995-line monolith:
 *   - Fetches only the analytics payload (trend/comparison/status data).
 *   - Does NOT render stat cards — those are now a Server Component (StatsGrid).
 *   - Uses AbortController on every fetch so rapid filter changes never
 *     produce race conditions or stale-data flickers.
 *   - Standardised on Chart.js / react-chartjs-2 exclusively.
 *     Recharts and Victory imports have been removed.
 *   - Filter panel uses the same draft/apply pattern as the tasks page.
 *   - Theme detection via MutationObserver (unchanged from before).
 */

import { useEffect, useMemo, useRef, useState } from "react";
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
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useFilters } from "@/lib/useFilters";

// ── Chart.js lazy imports (no SSR) ────────────────────────────────────────
const Line = dynamic(() => import("react-chartjs-2").then((m) => m.Line), { ssr: false });
const Bar  = dynamic(() => import("react-chartjs-2").then((m) => m.Bar),  { ssr: false });
const Doughnut = dynamic(() => import("react-chartjs-2").then((m) => m.Doughnut), { ssr: false });

ChartJS.register(
  CategoryScale, LinearScale,
  PointElement, LineElement,
  ArcElement,
  BarElement,
  Tooltip, Legend,
);

// ─── Types ────────────────────────────────────────────────────────────────

type ChartData = {
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

// ─── Colours ──────────────────────────────────────────────────────────────

const C = {
  open:          "hsl(214 74% 62%)",
  openSoft:      "hsl(214 74% 62% / 0.22)",
  inProgress:    "hsl(216 83% 56%)",
  inProgressSoft:"hsl(216 83% 56% / 0.2)",
  resolved:      "hsl(225 73% 48%)",
  closed:        "hsl(230 68% 42%)",
  // Priority colors
  low:           "hsl(142 76% 36%)",
  medium:        "hsl(48 96% 53%)",
  high:          "hsl(0 84% 60%)",
  // Severity colors
  minor:         "hsl(173 58% 39%)",
  major:         "hsl(25 95% 53%)",
  critical:      "hsl(346 77% 50%)",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────

function cssVar(name: string, alpha?: number): string {
  if (typeof window === "undefined") return "";
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!val) return "";
  return alpha === undefined ? `hsl(${val})` : `hsl(${val} / ${alpha})`;
}

function fmtDate(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtRange(a: Date | null, b: Date | null): string {
  if (!a) return "";
  if (!b || a.getTime() === b.getTime()) return fmtDate(a);
  return `${fmtDate(a)} – ${fmtDate(b)}`;
}

function buildBuckets(points: TimelinePoint[]): BucketSummary[] {
  if (!points.length) return [];
  const n = Math.min(6, Math.max(3, Math.ceil(points.length / 7)));
  const size = Math.max(1, Math.ceil(points.length / n));
  const out: BucketSummary[] = [];
  for (let i = 0; i < points.length; i += size) {
    const chunk = points.slice(i, i + size);
    if (!chunk.length) continue;
    out.push({
      label: fmtRange(chunk[0].date, chunk[chunk.length - 1].date),
      startDate: chunk[0].date,
      endDate: chunk[chunk.length - 1].date,
      open:   chunk.reduce((s, p) => s + p.open, 0),
      closed: chunk.reduce((s, p) => s + p.closed, 0),
    });
  }
  return out;
}

// ─── Component ────────────────────────────────────────────────────────────

export default function DashboardCharts() {
  const router = useRouter();

  // ── Filter state ────────────────────────────────────────────────────────
  const [statusFilter,   setStatusFilter]   = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [searchInput,  setSearchInput]  = useState("");
  const [searchQuery,  setSearchQuery]  = useState("");
  const [timeRange, setTimeRange] = useState("30d");

  const filtersPanelRef = useRef<HTMLDivElement>(null);
  const hasActiveFilters = Boolean(statusFilter || priorityFilter || severityFilter);
  const activeFilterCount = [statusFilter, priorityFilter, severityFilter].filter(Boolean).length;

  const { drafts, setField, apply, clear, isOpen: filtersOpen, setIsOpen } = useFilters(
    { status: statusFilter, priority: priorityFilter, severity: severityFilter },
    {
      onApply: (d) => {
        setStatusFilter(d.status ?? "");
        setPriorityFilter(d.priority ?? "");
        setSeverityFilter(d.severity ?? "");
        setIsOpen(false);
      },
    },
  );
  const hasDraftFilters = Boolean(drafts.status || drafts.priority || drafts.severity);
  const hasPendingChanges =
    (drafts.status   ?? "") !== statusFilter   ||
    (drafts.priority ?? "") !== priorityFilter ||
    (drafts.severity ?? "") !== severityFilter;

  // ── Data fetch with AbortController ─────────────────────────────────────
  const [data, setData]       = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (statusFilter)   params.set("status",   statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    if (severityFilter) params.set("severity", severityFilter);
    if (searchQuery)    params.set("q",        searchQuery);
    if (timeRange)      params.set("range",    timeRange);

    setLoading(true);
    setFetchError(null);

    fetch(`/api/dashboard/stats?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error ?? "Failed to load analytics");
        setData(payload as ChartData);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return; // intentional — ignore
        setFetchError(err.message);
        setData(null);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [statusFilter, priorityFilter, severityFilter, searchQuery, timeRange]);

  // ── Search debounce ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = window.setTimeout(() => {
      const v = searchInput.trim();
      setSearchQuery(v.length >= 2 ? v : "");
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  // ── Close filter panel on outside click / Escape ─────────────────────────
  useEffect(() => {
    function onPointer(e: PointerEvent) {
      if (!filtersOpen) return;
      const el = e.target as Element | null;
      if (el?.closest('[data-select-content="true"]')) return;
      if (filtersPanelRef.current && !filtersPanelRef.current.contains(el)) {
        setIsOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen, setIsOpen]);

  // ── Theme detection ──────────────────────────────────────────────────────
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setThemeMode(root.classList.contains("dark") ? "dark" : "light");
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const uiColors = useMemo(() => {
    const dark = themeMode === "dark";
    return {
      legendText:    cssVar("--muted-foreground")  || "hsl(215 16% 42%)",
      axisText:      cssVar("--muted-foreground")  || "hsl(215 16% 42%)",
      tooltipBg:     dark ? "hsl(222 30% 8% / 0.96)" : cssVar("--popover") || "hsl(0 0% 100%)",
      tooltipText:   dark ? "hsl(210 20% 97%)" : cssVar("--popover-foreground") || "hsl(222 47% 11%)",
      tooltipBorder: dark ? "hsl(218 22% 32% / 0.9)" : cssVar("--border") || "hsl(214 24% 88%)",
      grid:          cssVar("--border", dark ? 0.5 : 0.55) || "hsl(214 24% 88%)",
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeMode]);

  // ── Derived chart datasets ───────────────────────────────────────────────
  const timelinePoints = useMemo<TimelinePoint[]>(() => {
    if (!data?.trend) return [];
    const lookup = new Map(data.trend.datasets.map((d) => [d.label.toLowerCase(), d.data]));
    return data.trend.labels.map((lbl, i) => {
      const parsed = new Date(lbl);
      const date = Number.isNaN(parsed.getTime()) ? null : parsed;
      return {
        date,
        label: date ? fmtDate(date) : lbl.slice(5),
        open:       lookup.get("open")?.[i]        ?? 0,
        inProgress: lookup.get("in progress")?.[i] ?? 0,
        resolved:   lookup.get("resolved")?.[i]    ?? 0,
        closed:     lookup.get("closed")?.[i]      ?? 0,
      };
    });
  }, [data]);

  const buckets = useMemo(() => buildBuckets(timelinePoints), [timelinePoints]);

  const trendDataset = useMemo(() => ({
    labels: timelinePoints.map((p) => p.label),
    datasets: [
      { label: "Open",        data: timelinePoints.map((p) => p.open),        borderColor: C.open,       backgroundColor: C.openSoft,       fill: true, tension: 0.38, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2 },
      { label: "In Progress", data: timelinePoints.map((p) => p.inProgress),  borderColor: C.inProgress, backgroundColor: C.inProgressSoft, fill: true, tension: 0.38, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2 },
    ],
  }), [timelinePoints]);

  const comparisonDataset = useMemo(() => ({
    labels: buckets.map((b) => b.label),
    datasets: [
      { label: "Open",   data: buckets.map((b) => b.open),   backgroundColor: C.open,   borderRadius: 8, borderSkipped: false as const, barThickness: 14 },
      { label: "Closed", data: buckets.map((b) => b.closed), backgroundColor: C.closed, borderRadius: 8, borderSkipped: false as const, barThickness: 14 },
    ],
  }), [buckets]);

  const statusDataset = useMemo(() => ({
    labels: ["Open", "In Progress", "Resolved", "Closed"],
    datasets: [{
      label: "Status mix",
      data: data ? [data.open, data.inProgress, data.resolved, data.closed] : [],
      backgroundColor: [C.open, C.inProgress, C.resolved, C.closed],
      borderWidth: 0, borderRadius: 10, hoverOffset: 4, spacing: 2, offset: [14, 0, 0, 0],
    }],
  }), [data]);

  const priorityDataset = useMemo(() => ({
    labels: ["Low", "Medium", "High"],
    datasets: [{
      label: "Priority distribution",
      data: data ? [data.low, data.medium, data.high] : [],
      backgroundColor: [C.low, C.medium, C.high],
      borderWidth: 0, borderRadius: 10, hoverOffset: 4, spacing: 2, offset: [12, 0, 0],
    }],
  }), [data]);

  const severityDataset = useMemo(() => ({
    labels: ["Minor", "Major", "Critical"],
    datasets: [{
      label: "Severity distribution",
      data: data ? [data.minor, data.major, data.critical] : [],
      backgroundColor: [C.minor, C.major, C.critical],
      borderWidth: 0, borderRadius: 10, hoverOffset: 4, spacing: 2, offset: [12, 0, 0],
    }],
  }), [data]);

  // ── Derived booleans ─────────────────────────────────────────────────────
  const hasStatusData     = Boolean(data && [data.open, data.inProgress, data.resolved, data.closed].some((v) => v > 0));
  const hasPriorityData   = Boolean(data && [data.low, data.medium, data.high].some((v) => v > 0));
  const hasSeverityData   = Boolean(data && [data.minor, data.major, data.critical].some((v) => v > 0));
  const hasComparisonData = buckets.some((b) => b.open > 0 || b.closed > 0);
  const hasTrendData      = timelinePoints.some((p) => p.open > 0 || p.inProgress > 0);

  // ── Navigate on chart click ──────────────────────────────────────────────
  function goToIssues(filters: { status?: string; priority?: string; severity?: string; createdFrom?: Date | null; createdTo?: Date | null }) {
    const p = new URLSearchParams({ view: "details", page: "1" });
    if (filters.status)      p.set("status",      filters.status);
    if (filters.priority)    p.set("priority",    filters.priority);
    if (filters.severity)    p.set("severity",    filters.severity);
    if (filters.createdFrom) p.set("createdFrom", filters.createdFrom.toISOString().slice(0, 10));
    if (filters.createdTo)   p.set("createdTo",   filters.createdTo.toISOString().slice(0, 10));
    router.push(`/tasks?${p.toString()}`);
  }

  // ── Chart options (shared tooltip config) ────────────────────────────────
  const tooltipBase = useMemo(() => ({
    backgroundColor: uiColors.tooltipBg,
    titleColor:      uiColors.tooltipText,
    bodyColor:       uiColors.tooltipText,
    borderColor:     uiColors.tooltipBorder,
    borderWidth: 1,
    padding: 10,
    cornerRadius: 8,
    callbacks: { labelTextColor: () => uiColors.tooltipText },
  }), [uiColors]);

  const legendBase = useMemo(() => ({
    position: "bottom" as const,
    labels: {
      usePointStyle: true,
      pointStyle: "rectRounded" as const,
      boxWidth: 10, boxHeight: 10, padding: 10,
      font: { size: 11, weight: 600 } as const,
      color: uiColors.legendText,
    },
  }), [uiColors]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <section className="space-y-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground/90">Analytics</h2>
        <span className="text-xs text-muted-foreground">Chart.js · filtered</span>
      </div>

      {/* ── Filter toolbar ─────────────────────────────────────────────── */}
      <div className="rounded-xl bg-muted/20 p-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-full max-w-[290px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search issues (≥ 2 chars)"
              aria-label="Search dashboard issues"
              className="h-8 rounded-md pl-8 pr-7 text-xs"
            />
            {searchInput ? (
              <Button type="button" variant="ghost" size="icon"
                onClick={() => { setSearchInput(""); setSearchQuery(""); }}
                aria-label="Clear search"
                className="absolute right-0.5 top-1/2 h-6 w-6 -translate-y-1/2 rounded-md">
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            ) : null}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {/* Filters popover */}
            <div ref={filtersPanelRef} className="relative">
              <Button type="button" variant="outline" size="sm"
                className="relative h-8 w-8 rounded-md p-0"
                aria-label="Toggle analytics filters"
                aria-expanded={filtersOpen}
                onClick={() => filtersOpen ? setIsOpen(false) : (setField("status", statusFilter), setField("priority", priorityFilter), setField("severity", severityFilter), setIsOpen(true))}>
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                {hasActiveFilters ? (
                  <span aria-hidden="true"
                    className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>

              {filtersOpen ? (
                <Card className="popover-surface absolute right-0 top-9 z-30 w-[min(88vw,220px)] bg-card shadow-lg">
                  <CardContent className="space-y-1.5 p-2">
                    <Select value={drafts.status ?? ""} onValueChange={(v) => setField("status", v)} className="h-8 text-xs">
                      <option value="">All statuses</option>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </Select>
                    <Select value={drafts.priority ?? ""} onValueChange={(v) => setField("priority", v)} className="h-8 text-xs">
                      <option value="">All priorities</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </Select>
                    <Select value={drafts.severity ?? ""} onValueChange={(v) => setField("severity", v)} className="h-8 text-xs">
                      <option value="">All severities</option>
                      <option value="MINOR">Minor</option>
                      <option value="MAJOR">Major</option>
                      <option value="CRITICAL">Critical</option>
                    </Select>
                    <div className="flex items-center justify-end gap-1.5 pt-0.5">
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={!hasDraftFilters} onClick={() => clear()}>Clear</Button>
                      <Button type="button" size="dense" className="h-7 px-2 text-xs" disabled={!hasPendingChanges} onClick={() => apply()}>Apply</Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            {/* Time range */}
            <Select value={timeRange} onValueChange={setTimeRange} className="h-8 w-[120px] text-xs">
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
              <option value="365d">1 year</option>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Error state ───────────────────────────────────────────────────── */}
      {fetchError ? (
        <Card>
          <CardContent className="p-4 text-sm text-destructive" role="alert">
            {fetchError}
          </CardContent>
        </Card>
      ) : null}

      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading charts">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-[280px] w-full rounded-xl" />
            <Skeleton className="h-[280px] w-full rounded-xl" />
            <Skeleton className="h-[280px] w-full rounded-xl" />
          </div>
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            <Skeleton className="h-[280px] w-full rounded-xl" />
            <Skeleton className="h-[280px] w-full rounded-xl" />
          </div>
          <Skeleton className="h-[280px] w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* ── Doughnut charts row (Status, Priority, Severity) ───────── */}
          {(hasStatusData || hasPriorityData || hasSeverityData) ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {hasStatusData ? (
                <Card className="glass-card min-w-0">
                  <CardHeader className="pb-2.5">
                    <CardTitle className="text-base font-semibold">Status mix</CardTitle>
                    <CardDescription className="text-xs">Issue distribution by workflow state.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-2.5">
                    <div className="mx-auto h-[190px] w-full max-w-[220px] lg:h-[210px] lg:max-w-[240px]">
                      <Doughnut
                        key={`status-${themeMode}`}
                        data={statusDataset}
                        options={{
                          responsive: true, maintainAspectRatio: false,
                          animation: { duration: 220, easing: "easeOutCubic" },
                          cutout: "66%", rotation: -90,
                          onClick: (_e, els) => {
                            if (!els.length) return;
                            const lbl = statusDataset.labels[els[0].index];
                            const map: Record<string, string> = { Open: "OPEN", "In Progress": "IN_PROGRESS", Resolved: "RESOLVED", Closed: "CLOSED" };
                            goToIssues({ status: map[lbl] });
                          },
                          plugins: { legend: legendBase, tooltip: tooltipBase },
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {hasPriorityData ? (
                <Card className="glass-card min-w-0">
                  <CardHeader className="pb-2.5">
                    <CardTitle className="text-base font-semibold">Priority distribution</CardTitle>
                    <CardDescription className="text-xs">Issue breakdown by priority level.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-2.5">
                    <div className="mx-auto h-[190px] w-full max-w-[220px] lg:h-[210px] lg:max-w-[240px]">
                      <Doughnut
                        key={`priority-${themeMode}`}
                        data={priorityDataset}
                        options={{
                          responsive: true, maintainAspectRatio: false,
                          animation: { duration: 220, easing: "easeOutCubic" },
                          cutout: "66%", rotation: -90,
                          onClick: (_e, els) => {
                            if (!els.length) return;
                            const lbl = priorityDataset.labels[els[0].index];
                            const map: Record<string, string> = { Low: "LOW", Medium: "MEDIUM", High: "HIGH" };
                            goToIssues({ priority: map[lbl] });
                          },
                          plugins: { legend: legendBase, tooltip: tooltipBase },
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {hasSeverityData ? (
                <Card className="glass-card min-w-0">
                  <CardHeader className="pb-2.5">
                    <CardTitle className="text-base font-semibold">Severity distribution</CardTitle>
                    <CardDescription className="text-xs">Issue breakdown by severity level.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-2.5">
                    <div className="mx-auto h-[190px] w-full max-w-[220px] lg:h-[210px] lg:max-w-[240px]">
                      <Doughnut
                        key={`severity-${themeMode}`}
                        data={severityDataset}
                        options={{
                          responsive: true, maintainAspectRatio: false,
                          animation: { duration: 220, easing: "easeOutCubic" },
                          cutout: "66%", rotation: -90,
                          onClick: (_e, els) => {
                            if (!els.length) return;
                            const lbl = severityDataset.labels[els[0].index];
                            const map: Record<string, string> = { Minor: "MINOR", Major: "MAJOR", Critical: "CRITICAL" };
                            goToIssues({ severity: map[lbl] });
                          },
                          plugins: { legend: legendBase, tooltip: tooltipBase },
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : null}

          {/* ── Bar comparison row ──────────────────────────────────────── */}
          {hasComparisonData ? (
            <Card className="glass-card min-w-0">
              <CardHeader className="pb-2.5">
                <CardTitle className="text-base font-semibold">Open vs closed</CardTitle>
                <CardDescription className="text-xs">Issue throughput by grouped date buckets.</CardDescription>
              </CardHeader>
              <CardContent className="p-2.5">
                <div className="h-[190px] w-full lg:h-[210px]">
                  <Bar
                    key={`comparison-${themeMode}`}
                    data={comparisonDataset}
                    options={{
                      responsive: true, maintainAspectRatio: false,
                      animation: { duration: 220, easing: "easeOutCubic" },
                      onClick: (_e, els) => {
                        if (!els.length) return;
                        const { datasetIndex, index } = els[0];
                        const b = buckets[index];
                        if (!b) return;
                        goToIssues({ status: datasetIndex === 0 ? "OPEN" : "CLOSED", createdFrom: b.startDate, createdTo: b.endDate });
                      },
                      plugins: { legend: legendBase, tooltip: tooltipBase },
                      scales: {
                        x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 6, font: { size: 11 }, color: uiColors.axisText }, border: { display: false } },
                        y: { beginAtZero: true, ticks: { precision: 0, font: { size: 11 }, color: uiColors.axisText }, grid: { color: uiColors.grid }, border: { display: false } },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* ── Trend line ────────────────────────────────────────────────── */}
          {hasTrendData ? (
            <Card className="glass-card min-w-0">
              <CardHeader className="pb-2.5">
                <CardTitle className="text-base font-semibold">Issue trend</CardTitle>
                <CardDescription className="text-xs">Open and in-progress issues across the selected range.</CardDescription>
              </CardHeader>
              <CardContent className="p-2.5">
                <div className="h-[210px] w-full lg:h-[230px]">
                  <Line
                    key={`trend-${themeMode}`}
                    data={trendDataset}
                    options={{
                      responsive: true, maintainAspectRatio: false,
                      animation: { duration: 220, easing: "easeOutCubic" },
                      interaction: { mode: "index", intersect: false },
                      onClick: (_e, els) => {
                        if (!els.length) return;
                        const { datasetIndex, index } = els[0];
                        const ds = trendDataset.datasets[datasetIndex];
                        const status = ds?.label === "Open" ? "OPEN" : ds?.label === "In Progress" ? "IN_PROGRESS" : undefined;
                        const pt = timelinePoints[index];
                        goToIssues({ status, createdFrom: pt?.date ?? null, createdTo: pt?.date ?? null });
                      },
                      plugins: { legend: legendBase, tooltip: { ...tooltipBase, displayColors: true } },
                      scales: {
                        y: { beginAtZero: true, ticks: { precision: 0, font: { size: 11 }, color: uiColors.axisText }, grid: { color: uiColors.grid }, border: { display: false } },
                        x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8, font: { size: 11 }, color: uiColors.axisText }, border: { display: false } },
                      },
                      elements: { line: { borderCapStyle: "round", borderJoinStyle: "round" }, point: { radius: 0, hoverRadius: 4 } },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {!hasStatusData && !hasPriorityData && !hasSeverityData && !hasComparisonData && !hasTrendData ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No analytics data for the selected filters and time range.
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </section>
  );
}
