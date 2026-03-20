"use client";
import { useEffect, useState } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
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
    fetch(`/api/dashboard/stats?${params.toString()}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [statusFilter, priorityFilter, severityFilter, timeRange]);

  if (loading) return <div>Loading charts...</div>;
  if (!data) return <div>No data available.</div>;

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
    <div>
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-2 py-1">
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border rounded px-2 py-1">
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="border rounded px-2 py-1">
          <option value="">All Severities</option>
          <option value="MINOR">Minor</option>
          <option value="MAJOR">Major</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border rounded px-2 py-1">
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="365d">Last year</option>
        </select>
        <button
          className="ml-auto px-3 py-1 bg-gray-200 rounded text-sm"
          onClick={() => {
            if (!data) return;
            const csv = [
              ["Date", ...trendData.datasets.map((ds: any) => ds.label)].join(
                ",",
              ),
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
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="bg-white p-4 rounded shadow">
          <Bar
            data={statusData}
            options={{ plugins: { legend: { display: false } } }}
          />
        </div>
        <div className="bg-white p-4 rounded shadow">
          <Pie data={priorityData} />
        </div>
        <div className="bg-white p-4 rounded shadow">
          <Pie data={severityData} />
        </div>
      </div>
      <div className="bg-white p-4 rounded shadow mt-8">
        <h2 className="font-semibold mb-2">Issue Trends Over Time</h2>
        <Line data={trendData} />
      </div>
    </div>
  );
}
