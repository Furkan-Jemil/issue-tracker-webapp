/**
 * GET /api/issues/search
 *
 * Lightweight issue search endpoint used exclusively by the command palette.
 * Returns a small projection — only what the palette needs to render a result
 * row and navigate to the detail page.
 *
 * Query params:
 *   q        — search string (required, min 2 chars, max 100 chars)
 *   limit    — max results to return (default 6, max 10)
 *
 * Response:
 *   { issues: Array<{ id, title, status, priority, type }> }
 *
 * Security:
 *   - Session-gated: 401 if unauthenticated.
 *   - Row-level scoping mirrors the tasks page: admins see all issues,
 *     non-admins see only issues they created or are assigned to.
 *   - Query is parameterised via Prisma — no injection risk.
 *   - Hardcoded result cap (10) prevents enumeration abuse.
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getAppSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get("q")?.trim() ?? "";
    const rawLimit = searchParams.get("limit");

    // Enforce minimum length server-side as well — don't run a DB query for
    // single-character inputs.
    if (rawQuery.length < 2) {
      return NextResponse.json({ issues: [] });
    }

    // Clamp the query to 100 chars to prevent absurdly long LIKE patterns.
    const query = rawQuery.slice(0, 100);

    const parsedLimit = rawLimit !== null ? parseInt(rawLimit, 10) : 6;
    const limit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(parsedLimit, 10))
      : 6;

    const isAdmin = session.user.role === "ADMIN";

    // Non-admins see only issues they created or are assigned to — same
    // scoping logic as the main tasks page.
    const ownershipFilter = isAdmin
      ? {}
      : {
          OR: [
            { createdBy: session.user.id },
            { assigneeId: session.user.id },
          ],
        };

    const issues = await prisma.issue.findMany({
      where: {
        ...ownershipFilter,
        title: { contains: query, mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        type: true,
      },
    });

    return NextResponse.json({ issues });
  } catch (error) {
    console.error("GET /api/issues/search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
