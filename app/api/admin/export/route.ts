import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth/session";
import { PrismaClient } from "@prisma/client";



export async function GET(req: NextRequest) {
  try {
    const session = await getAppSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [users, issues, comments, screenshots, notifications, history] =
      await Promise.all([
        prisma.user.findMany(),
        prisma.issue.findMany(),
        prisma.comment.findMany(),
        prisma.screenshot.findMany(),
        prisma.notification.findMany(),
        prisma.issueHistory.findMany(),
      ]);

    const data = {
      users,
      issues,
      comments,
      screenshots,
      notifications,
      history,
    };
    return new NextResponse(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition":
          'attachment; filename="issue-tracker-export.json"',
      },
    });
  } catch (error) {
    console.error("Admin export failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
