import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/notifications/unread?userId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ count: 0 });
  }
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });
  return NextResponse.json({ count });
}
