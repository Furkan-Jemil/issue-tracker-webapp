import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({});
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const severity = searchParams.get("severity") || undefined;
  const range = searchParams.get("range") || "30d";
  const baseWhere: any = { createdBy: session.user.id };
  if (status) baseWhere.status = status;
  if (priority) baseWhere.priority = priority;
  if (severity) baseWhere.severity = severity;

  // Status counts
  const [open, inProgress, resolved, closed] = await Promise.all([
    prisma.issue.count({ where: { ...baseWhere, status: "OPEN" } }),
    prisma.issue.count({ where: { ...baseWhere, status: "IN_PROGRESS" } }),
    prisma.issue.count({ where: { ...baseWhere, status: "RESOLVED" } }),
    prisma.issue.count({ where: { ...baseWhere, status: "CLOSED" } }),
  ]);
  // Priority counts
  const [low, medium, high] = await Promise.all([
    prisma.issue.count({ where: { ...baseWhere, priority: "LOW" } }),
    prisma.issue.count({ where: { ...baseWhere, priority: "MEDIUM" } }),
    prisma.issue.count({ where: { ...baseWhere, priority: "HIGH" } }),
  ]);
  // Severity counts
  const [minor, major, critical] = await Promise.all([
    prisma.issue.count({ where: { ...baseWhere, severity: "MINOR" } }),
    prisma.issue.count({ where: { ...baseWhere, severity: "MAJOR" } }),
    prisma.issue.count({ where: { ...baseWhere, severity: "CRITICAL" } }),
  ]);

  // Time-based trend (group by day)
  const now = new Date();
  let days = 30;
  if (range === "7d") days = 7;
  else if (range === "90d") days = 90;
  else if (range === "365d") days = 365;
  const start = new Date(now);
  start.setDate(now.getDate() - days + 1);

  // Get all issues in range
  const issues = await prisma.issue.findMany({
    where: {
      ...baseWhere,
      createdAt: { gte: start, lte: now },
    },
    select: { createdAt: true, status: true },
  });

  // Group by day
  const trendMap: Record<
    string,
    { OPEN: number; IN_PROGRESS: number; RESOLVED: number; CLOSED: number }
  > = {};
  for (let i = 0; i < days; ++i) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    trendMap[key] = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 };
  }
  for (const issue of issues) {
    const key = issue.createdAt.toISOString().slice(0, 10);
    if (trendMap[key]) {
      trendMap[key][issue.status]++;
    }
  }
  const labels = Object.keys(trendMap);
  const trend = {
    labels,
    datasets: [
      {
        label: "Open",
        data: labels.map((l) => trendMap[l].OPEN),
        borderColor: "#3b82f6",
        backgroundColor: "#3b82f6",
        fill: false,
      },
      {
        label: "In Progress",
        data: labels.map((l) => trendMap[l].IN_PROGRESS),
        borderColor: "#facc15",
        backgroundColor: "#facc15",
        fill: false,
      },
      {
        label: "Resolved",
        data: labels.map((l) => trendMap[l].RESOLVED),
        borderColor: "#22c55e",
        backgroundColor: "#22c55e",
        fill: false,
      },
      {
        label: "Closed",
        data: labels.map((l) => trendMap[l].CLOSED),
        borderColor: "#a3a3a3",
        backgroundColor: "#a3a3a3",
        fill: false,
      },
    ],
  };

  return NextResponse.json({
    open,
    inProgress,
    resolved,
    closed,
    low,
    medium,
    high,
    minor,
    major,
    critical,
    trend,
  });
}
