import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/auth/get-session
// Returns the current user from session cookie or Bearer token (mobile).
export async function GET(request: NextRequest) {
  try {
    // Try cookie first (web)
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = cookieHeader.split(";").map((s) => s.trim());
    const tokenCookie = cookies.find((v) =>
      v.startsWith("better-auth.session_token=")
    );
    let token = tokenCookie ? tokenCookie.split("=").slice(1).join("=") : null;

    // Fallback: Bearer token (mobile)
    if (!token) {
      const authHeader = request.headers.get("authorization") || "";
      if (authHeader.startsWith("Bearer ")) token = authHeader.slice(7);
    }

    if (!token) return NextResponse.json(null);

    const session = await prisma.session.findUnique({
      where: { token },
      select: { userId: true, expiresAt: true },
    });
    if (!session) return NextResponse.json(null);
    if (session.expiresAt.getTime() < Date.now()) return NextResponse.json(null);

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) return NextResponse.json(null);

    return NextResponse.json({ user });
  } catch (err) {
    console.error("GET /api/auth/get-session error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
