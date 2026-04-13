import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { parseEnumValue } from "@/lib/issueValidation";

export async function GET(req: NextRequest) {
  try {
    const session = await getAppSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ users: [] }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const role = parseEnumValue(searchParams.get("role"), Object.values(Role));
    const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
    const pageSizeRaw = Number(searchParams.get("pageSize") || "20") || 20;
    const pageSize = Math.min(Math.max(pageSizeRaw, 1), 100);
    const skip = (page - 1) * pageSize;

    const where = {
      ...(role ? { role } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, pageSize });
  } catch (error) {
    console.error("Failed to list admin users", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
