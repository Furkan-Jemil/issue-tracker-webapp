import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/auth/sign-out
// Deletes the session from DB and clears the cookie (web + mobile).
export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = cookieHeader.split(";").map((s) => s.trim());
    const tokenCookie = cookies.find((v) =>
      v.startsWith("better-auth.session_token=")
    );

    const tokensToDelete: string[] = [];
    if (tokenCookie) tokensToDelete.push(tokenCookie.split("=").slice(1).join("="));

    const authHeader = request.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) tokensToDelete.push(authHeader.slice(7));

    if (tokensToDelete.length > 0) {
      await prisma.session.deleteMany({
        where: { token: { in: tokensToDelete } },
      });
    }

    const expireCookieParts = [
      "better-auth.session_token=",
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      "Max-Age=0",
    ];
    if (process.env.NODE_ENV === "production") expireCookieParts.push("Secure");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": expireCookieParts.join("; "),
      },
    });
  } catch (err) {
    console.error("POST /api/auth/sign-out error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
