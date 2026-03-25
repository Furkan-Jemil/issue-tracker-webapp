"use client";
import { useEffect, useState } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

const statusColors = ["#3b82f6", "#facc15", "#22c55e", "#a3a3a3"];
const priorityColors = ["#38bdf8", "#fbbf24", "#ef4444"];
const severityColors = ["#a3e635", "#f59e42", "#ef4444"];

export default function DashboardCharts() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [timeRange, setTimeRange] = useState("30d");

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
        if (!res.ok) {
          throw new Error(payload?.error || "Failed to load dashboard stats");
        }
        return payload;
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setData(null);
        setLoading(false);
      });
  }, [statusFilter, priorityFilter, severityFilter, timeRange]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Loading charts...
        </CardContent>
      </Card>
    );
  }
  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }
  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          No data available.
        </CardContent>
      </Card>
    );
  }

  const statusData = {
    labels: ["Open", "In Progress", "Resolved", "Closed"],
    datasets: [
      {
        label: "Issues by Status",
        data: [data.open, data.inProgress, data.resolved, data.closed],
        backgroundColor: statusColors,
      },
    ],
  };

  const priorityData = {
    labels: ["Low", "Medium", "High"],
    datasets: [
      {
        label: "Issues by Priority",
        data: [data.low, data.medium, data.high],
        backgroundColor: priorityColors,
      },
    ],
  };

  const severityData = {
    labels: ["Minor", "Major", "Critical"],
    datasets: [
      {
        label: "Issues by Severity",
        data: [data.minor, data.major, data.critical],
        backgroundColor: severityColors,
      },
    ],
  };

  // Time trend chart data (stub, to be filled by API)
  const trendData = data?.trend || { labels: [], datasets: [] };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Link href="/issues">
          <Card className="h-full transition-transform hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Total Issues
              </div>
              <div className="text-2xl font-bold">{data.totalIssues}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/issues/filter?status=OPEN">
          <Card className="h-full transition-transform hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Open
              </div>
              <div className="text-2xl font-bold">{data.open}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/issues/filter?status=IN_PROGRESS">
          <Card className="h-full transition-transform hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                In Progress
              </div>
              <div className="text-2xl font-bold">{data.inProgress}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/issues/filter?status=RESOLVED">
          <Card className="h-full transition-transform hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Resolved
              </div>
              <div className="text-2xl font-bold">{data.resolved}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/issues/filter?status=CLOSED">
          <Card className="h-full transition-transform hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Closed
              </div>
              <div className="text-2xl font-bold">{data.closed}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <Badge variant="outline">Range: {timeRange}</Badge>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </Select>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>
            <Select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}>
              <option value="">All Severities</option>
              <option value="MINOR">Minor</option>
              <option value="MAJOR">Major</option>
              <option value="CRITICAL">Critical</option>
            </Select>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="365d">Last year</option>
            </Select>
            <Button
              variant="outline"
              className="ml-auto"
              onClick={() => {
                if (!data) return;
                const csv = [
                  [
                    "Date",
                    ...trendData.datasets.map((ds: any) => ds.label),
                  ].join(","),
                  ...trendData.labels.map((label: string, i: number) =>
                    [
                      label,
                      ...trendData.datasets.map((ds: any) => ds.data[i]),
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
              Export Trends CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <Bar
              data={statusData}
              options={{ plugins: { legend: { display: false } } }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Pie data={priorityData} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Pie data={severityData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Issue Trends Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <Line data={trendData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.recentIssues?.map((issue: any) => (
              <li
                key={issue.id}
                className="rounded-md border bg-background p-3">
                <div>
                  <Link
                    href={`/issues/${issue.id}`}
                    className="font-semibold text-primary hover:underline">
                    {issue.title}
                  </Link>
                </div>
                <div className="text-sm text-muted-foreground">
                  Reporter: {issue.creator?.name || issue.creator?.email}
                </div>
                <div className="text-sm text-muted-foreground">
                  Priority: {issue.priority} | Status: {issue.status}
                </div>
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
