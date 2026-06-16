import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { parseEnumValue } from "@/lib/issueValidation";
import { applyRateLimit } from "@/lib/rateLimit";

const MAX_BULK_ROLE_IDS = 500;
const MAX_USER_ID_LENGTH = 191;

function normalizeId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_USER_ID_LENGTH) return null;
  return trimmed;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAppSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rateLimited = applyRateLimit(req, {
      keyPrefix: "admin-users-bulk-role:post",
      identifier: session.user.id,
      max: 10,
      windowMs: 60_000,
    });
    if (rateLimited) {
      return rateLimited;
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const ids = "ids" in body ? body.ids : null;
    const parsedRole = parseEnumValue(
      "role" in body ? body.role : null,
      Object.values(Role),
    );
    if (!Array.isArray(ids) || !parsedRole) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const uniqueIds = Array.from(
      new Set(ids.map((id) => normalizeId(id)).filter((id): id is string => Boolean(id))),
    );
    if (uniqueIds.length === 0 || uniqueIds.length > MAX_BULK_ROLE_IDS) {
      return NextResponse.json({ error: "Invalid ids list" }, { status: 400 });
    }

    const targetUsers = await prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, role: true },
    });

    if (targetUsers.length !== uniqueIds.length) {
      return NextResponse.json(
        { error: "One or more user IDs do not exist" },
        { status: 400 },
      );
    }

    if (uniqueIds.includes(session.user.id) && parsedRole !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Cannot remove your own admin role in bulk update" },
        { status: 400 },
      );
    }

    if (parsedRole !== Role.ADMIN) {
      const adminsToDemote = targetUsers.filter(
        (user) => user.role === Role.ADMIN,
      ).length;

      if (adminsToDemote > 0) {
        const totalAdmins = await prisma.user.count({
          where: { role: Role.ADMIN },
        });

        if (totalAdmins - adminsToDemote < 1) {
          return NextResponse.json(
            { error: "At least one admin must remain" },
            { status: 400 },
          );
        }
      }
    }

    const updateResult = await prisma.user.updateMany({
      where: { id: { in: uniqueIds } },
      data: { role: parsedRole },
    });

    if (updateResult.count !== uniqueIds.length) {
      return NextResponse.json(
        { error: "Bulk update did not apply to all requested users" },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      updatedCount: updateResult.count,
    });
  } catch (error) {
    console.error("Bulk role update failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
