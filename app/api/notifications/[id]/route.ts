import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth/session";
import { PrismaClient } from "@prisma/client";

// PATCH: Mark a single notification as read
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const session = await getAppSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notif = await prisma.notification.findUnique({
      where: { id },
    });
    if (!notif || notif.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update notification", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
