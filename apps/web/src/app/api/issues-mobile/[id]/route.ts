export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { defineAbilitiesFor, canTransition } from "@workspace/shared";

// Authenticate via Bearer token (same pattern as issues-mobile/route.ts)
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

// PATCH /api/issues-mobile/[id] — update issue fields
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ability = defineAbilitiesFor({ id: user.id, role: user.role as any });
    if (!ability.can("update", "Issue"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object")
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const existing = await prisma.issue.findUnique({
      where: { id },
      select: { id: true, createdBy: true, status: true, assigneeId: true },
    });
    if (!existing)
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });

    if (
      user.role !== "ADMIN" &&
      existing.createdBy !== user.id &&
      existing.assigneeId !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedFields = [
      "title",
      "description",
      "status",
      "priority",
      "severity",
      "type",
      "assigneeId",
    ];
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in body) updateData[field] = body[field];
    }

    if (Object.keys(updateData).length === 0)
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );

    // Enforce status-transition workflow
    if (
      "status" in updateData &&
      updateData.status !== existing.status &&
      !canTransition(existing.status, updateData.status)
    ) {
      return NextResponse.json(
        {
          error: `Invalid status transition: ${existing.status} → ${updateData.status}`,
        },
        { status: 422 }
      );
    }

    const updated = await prisma.issue.update({
      where: { id },
      data: updateData,
      include: {
        creator: { select: { name: true } },
        assignee: { select: { name: true } },
        comments: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/issues-mobile/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/issues-mobile/[id] — delete an issue
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ability = defineAbilitiesFor({ id: user.id, role: user.role as any });
    if (!ability.can("delete", "Issue"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const existing = await prisma.issue.findUnique({
      where: { id },
      select: { id: true, createdBy: true, assigneeId: true },
    });
    if (!existing)
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });

    if (
      user.role !== "ADMIN" &&
      existing.createdBy !== user.id &&
      existing.assigneeId !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.issue.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/issues-mobile/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
