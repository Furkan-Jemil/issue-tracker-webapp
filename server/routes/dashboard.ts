import { Context } from 'hono'
import prisma from '../../lib/prisma'
import { parseDashboardRange, parseIssueStatus, parsePriority, parseSeverity } from '../../lib/issueFilters'
import { Prisma } from '@prisma/client'
import { getServerSession } from '../lib/session'

export async function getDashboardStats(c: Context) {
  try {
    const session = await getServerSession(c.req.raw.headers)
    if (!session?.user) return c.json({ error: 'Unauthorized' }, 401)
    const isAdmin = session.user.role === 'ADMIN'

    const { searchParams } = new URL(c.req.url)
    const status = parseIssueStatus(searchParams.get('status'))
    const priority = parsePriority(searchParams.get('priority'))
    const severity = parseSeverity(searchParams.get('severity'))
    const query = searchParams.get('q')?.trim() || ''
    const range = parseDashboardRange(searchParams.get('range'))

    const baseWhere: Prisma.IssueWhereInput = { ...(isAdmin ? {} : { createdBy: session.user.id }) }
    if (status) baseWhere.status = status
    if (priority) baseWhere.priority = priority
    if (severity) baseWhere.severity = severity
    if (query) baseWhere.title = { contains: query, mode: 'insensitive' }

    const totalIssues = await prisma.issue.count({ where: baseWhere })

    const [open, inProgress, resolved, closed] = await Promise.all([
      prisma.issue.count({ where: { ...baseWhere, status: 'OPEN' } }),
      prisma.issue.count({ where: { ...baseWhere, status: 'IN_PROGRESS' } }),
      prisma.issue.count({ where: { ...baseWhere, status: 'RESOLVED' } }),
      prisma.issue.count({ where: { ...baseWhere, status: 'CLOSED' } }),
    ])

    const [low, medium, high] = await Promise.all([
      prisma.issue.count({ where: { ...baseWhere, priority: 'LOW' } }),
      prisma.issue.count({ where: { ...baseWhere, priority: 'MEDIUM' } }),
      prisma.issue.count({ where: { ...baseWhere, priority: 'HIGH' } }),
    ])

    const [minor, major, critical] = await Promise.all([
      prisma.issue.count({ where: { ...baseWhere, severity: 'MINOR' } }),
      prisma.issue.count({ where: { ...baseWhere, severity: 'MAJOR' } }),
      prisma.issue.count({ where: { ...baseWhere, severity: 'CRITICAL' } }),
    ])

    const now = new Date()
    let days = 30
    if (range === '7d') days = 7
    else if (range === '90d') days = 90
    else if (range === '365d') days = 365
    const start = new Date(now)
    start.setDate(now.getDate() - days + 1)

    const issues = await prisma.issue.findMany({ where: { ...baseWhere, createdAt: { gte: start, lte: now } }, select: { createdAt: true, status: true } })

    const trendMap: Record<string, { OPEN: number; IN_PROGRESS: number; RESOLVED: number; CLOSED: number }> = {}
    for (let i = 0; i < days; ++i) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      trendMap[key] = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 }
    }
    for (const issue of issues) {
      const key = issue.createdAt.toISOString().slice(0, 10)
      if (trendMap[key]) trendMap[key][issue.status]++
    }
    const labels = Object.keys(trendMap)
    const trend = {
      labels,
      datasets: [
        { label: 'Open', data: labels.map((l) => trendMap[l].OPEN), borderColor: '#3b82f6', backgroundColor: '#3b82f6', fill: false },
        { label: 'In Progress', data: labels.map((l) => trendMap[l].IN_PROGRESS), borderColor: '#facc15', backgroundColor: '#facc15', fill: false },
        { label: 'Resolved', data: labels.map((l) => trendMap[l].RESOLVED), borderColor: '#22c55e', backgroundColor: '#22c55e', fill: false },
        { label: 'Closed', data: labels.map((l) => trendMap[l].CLOSED), borderColor: '#a3a3a3', backgroundColor: '#a3a3a3', fill: false },
      ],
    }

    const recentIssues = await prisma.issue.findMany({ where: baseWhere, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, title: true, priority: true, status: true, createdAt: true, creator: { select: { name: true, email: true } } } })

    return c.json({ totalIssues, open, inProgress, resolved, closed, low, medium, high, minor, major, critical, trend, recentIssues })
  } catch (error) {
    console.error('Failed to fetch dashboard stats', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}
