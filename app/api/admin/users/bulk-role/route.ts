import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth/session";
import { PrismaClient, Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getAppSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { ids, role } = await req.json();
    if (
      !Array.isArray(ids) ||
      !role ||
      !["USER", "TESTER", "ADMIN"].includes(role)
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const uniqueIds = Array.from(new Set(ids)).filter(
      (id): id is string => typeof id === "string" && id.trim().length > 0,
    );
    if (uniqueIds.length === 0 || uniqueIds.length > 500) {
      return NextResponse.json({ error: "Invalid ids list" }, { status: 400 });
    }

    await prisma.user.updateMany({
      where: { id: { in: uniqueIds } },
      data: { role: role as Role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bulk role update failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
