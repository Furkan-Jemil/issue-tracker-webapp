import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Authenticate via Bearer token (used by mobile app)
async function getAuthUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const session = await prisma.session.findFirst({
    where: { token },
    include: { user: true },
  });
  if (!session || new Date() > new Date(session.expiresAt)) return null;
  return session.user;
}

// GET /api/audit-log — list audit log entries (IssueHistory)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const eventFilter = searchParams.get("event") || "";
    const query = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || "50") || 50, 1),
      200
    );
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (eventFilter && eventFilter !== "ALL") {
      where.eventType = eventFilter;
    }
    if (query) {
      where.OR = [
        { description: { contains: query, mode: "insensitive" as const } },
        { issue: { title: { contains: query, mode: "insensitive" as const } } },
        { actor: { name: { contains: query, mode: "insensitive" as const } } },
        { actor: { email: { contains: query, mode: "insensitive" as const } } },
      ];
    }

    // Non-admins only see their own events
    if (user.role !== "ADMIN") {
      where.actorId = user.id;
    }

    const [logs, total] = await Promise.all([
      prisma.issueHistory.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          actor: { select: { id: true, name: true, email: true } },
          issue: { select: { id: true, title: true } },
        },
      }),
      prisma.issueHistory.count({ where }),
    ]);

    return NextResponse.json({ logs, total, page, pageSize });
  } catch (error) {
    console.error("GET /api/audit-log error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
