import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";

// PATCH /api/admin/users/[id]/role — change a user's role (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAppSession();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const role = body?.role;
    if (!role || typeof role !== "string")
      return NextResponse.json(
        { error: "role is required" },
        { status: 400 }
      );

    const validRoles = ["ADMIN", "USER", "TESTER"];
    if (!validRoles.includes(role))
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 }
      );

    const user = await prisma.user.update({
      where: { id },
      data: { role: role as any },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("PATCH /api/admin/users/[id]/role error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
