import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Authenticate via Bearer token (used by mobile app)
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

// GET /api/users — list all users (for member picker / assignee dropdown)
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
