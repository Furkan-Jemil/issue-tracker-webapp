import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@workspace/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { ServerUser } from '../../common/auth/session.service';
import {
  parseDashboardRange,
  parseIssueStatus,
  parsePriority,
  parseSeverity,
} from '../../common/query/issue-filters';

export type DashboardStatsQuery = {
  status: string | null;
  priority: string | null;
  severity: string | null;
  q: string | null;
  range: string | null;
};

/**
 * DashboardService — VERBATIM port of apps/web/server/routes/dashboard.ts
 * `GET /stats`. Preserves the exact base-where scoping, count fan-out, trend
 * bucketing, hardcoded chart colors, and recentIssues shape.
 */
@Injectable()
export class DashboardService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async stats(query: DashboardStatsQuery, user: ServerUser) {
    const prisma = this.prisma.client;
    const isAdmin = user.role === 'ADMIN';

    const status = parseIssueStatus(query.status);
    const priority = parsePriority(query.priority);
    const severity = parseSeverity(query.severity);
    const q = query.q?.trim() || '';
    const range = parseDashboardRange(query.range);

    // Non-admins: scope to issues they created OR are assigned to.
    const baseWhere: Prisma.IssueWhereInput = {
      ...(isAdmin
        ? {}
        : { OR: [{ createdBy: user.id }, { assigneeId: user.id }] }),
    };
    if (status) baseWhere.status = status;
    if (priority) baseWhere.priority = priority;
    if (severity) baseWhere.severity = severity;
    if (q) baseWhere.title = { contains: q, mode: 'insensitive' };

    const totalIssues = await prisma.issue.count({ where: baseWhere });

    const [open, inProgress, resolved, closed] = await Promise.all([
      prisma.issue.count({ where: { ...baseWhere, status: 'OPEN' } }),
      prisma.issue.count({ where: { ...baseWhere, status: 'IN_PROGRESS' } }),
      prisma.issue.count({ where: { ...baseWhere, status: 'RESOLVED' } }),
      prisma.issue.count({ where: { ...baseWhere, status: 'CLOSED' } }),
    ]);

    const [low, medium, high] = await Promise.all([
      prisma.issue.count({ where: { ...baseWhere, priority: 'LOW' } }),
      prisma.issue.count({ where: { ...baseWhere, priority: 'MEDIUM' } }),
      prisma.issue.count({ where: { ...baseWhere, priority: 'HIGH' } }),
    ]);

    const [minor, major, critical] = await Promise.all([
      prisma.issue.count({ where: { ...baseWhere, severity: 'MINOR' } }),
      prisma.issue.count({ where: { ...baseWhere, severity: 'MAJOR' } }),
      prisma.issue.count({ where: { ...baseWhere, severity: 'CRITICAL' } }),
    ]);

    const now = new Date();
    let days = 30;
    if (range === '7d') days = 7;
    else if (range === '90d') days = 90;
    else if (range === '365d') days = 365;
    const start = new Date(now);
    start.setDate(now.getDate() - days + 1);

    const issues = await prisma.issue.findMany({
      where: { ...baseWhere, createdAt: { gte: start, lte: now } },
      select: { createdAt: true, status: true },
    });

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
      if (trendMap[key]) trendMap[key][issue.status]++;
    }
    const labels = Object.keys(trendMap);
    const trend = {
      labels,
      datasets: [
        { label: 'Open', data: labels.map((l) => trendMap[l].OPEN), borderColor: '#3b82f6', backgroundColor: '#3b82f6', fill: false },
        { label: 'In Progress', data: labels.map((l) => trendMap[l].IN_PROGRESS), borderColor: '#facc15', backgroundColor: '#facc15', fill: false },
        { label: 'Resolved', data: labels.map((l) => trendMap[l].RESOLVED), borderColor: '#22c55e', backgroundColor: '#22c55e', fill: false },
        { label: 'Closed', data: labels.map((l) => trendMap[l].CLOSED), borderColor: '#a3a3a3', backgroundColor: '#a3a3a3', fill: false },
      ],
    };

    const recentIssues = await prisma.issue.findMany({
      where: baseWhere,
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        priority: true,
        status: true,
        createdAt: true,
        creator: { select: { name: true, email: true } },
      },
    });

    return {
      totalIssues,
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
      recentIssues,
    };
  }
}
