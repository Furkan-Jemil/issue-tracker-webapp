export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth/session";
import { applyRateLimit } from "@/lib/rateLimit";

// GET: Fetch a single notification with related details
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid notification id" },
        { status: 400 },
      );
    }

    const session = await getAppSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        issue: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            severity: true,
            type: true,
            url: true,
            comments: {
              orderBy: { createdAt: "desc" },
              take: 5,
              select: {
                id: true,
                content: true,
                createdAt: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    role: true,
                  },
                },
              },
            },
            history: {
              orderBy: { createdAt: "desc" },
              take: 5,
              select: {
                id: true,
                eventType: true,
                description: true,
                createdAt: true,
                actor: {
                  select: {
                    id: true,
                    name: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error("Failed to fetch notification", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH: Mark a single notification as read
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid notification id" },
        { status: 400 },
      );
    }

    const session = await getAppSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimited = applyRateLimit(req, {
      keyPrefix: "notifications:patch-one",
      identifier: session.user.id,
      max: 60,
      windowMs: 60_000,
    });
    if (rateLimited) {
      return rateLimited;
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
