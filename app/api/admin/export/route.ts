import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Export all data (users, issues, comments, etc.)
  const [users, issues, comments, screenshots, notifications, history] =
    await Promise.all([
      prisma.user.findMany(),
      prisma.issue.findMany(),
      prisma.comment.findMany(),
      prisma.screenshot.findMany(),
      prisma.notification.findMany(),
      prisma.issueHistory.findMany(),
    ]);
  const data = { users, issues, comments, screenshots, notifications, history };
  return new NextResponse(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="issue-tracker-export.json"',
    },
  });
}
