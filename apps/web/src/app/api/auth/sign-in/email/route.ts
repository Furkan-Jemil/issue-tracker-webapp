import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/auth/sign-in/email
// Used by the mobile app to obtain a Bearer token.
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: any = {};
    if (contentType.includes("application/json")) {
      body = await request.json().catch(() => ({}));
    } else {
      const fd = await request.formData().catch(() => new FormData());
      body = Object.fromEntries(fd);
    }

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, password: true },
    });

    let storedPassword: string | null = user?.password ?? null;
    if (!storedPassword && user?.id) {
      const acct = await prisma.account.findFirst({
        where: { userId: user.id, providerId: { in: ["credential", "email"] } },
        select: { password: true },
      });
      storedPassword = acct?.password ?? null;
    }

    if (!user || !storedPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Support both bcrypt ($2...) and scrypt (better-auth default) hashes
    let passwordOk = false;
    if (storedPassword.startsWith("$2")) {
      passwordOk = await bcrypt.compare(password, storedPassword);
    } else {
      try {
        const ctx = await (auth as any).$context;
        passwordOk = await ctx.password.verify({
          password,
          hash: storedPassword,
        });
      } catch (err) {
        console.warn("scrypt password verify failed:", err);
        passwordOk = false;
      }
    }

    if (!passwordOk) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const sessionToken = randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: { userId: user.id, token: sessionToken, expiresAt },
    });

    const cookieParts = [
      `better-auth.session_token=${sessionToken}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
    ];
    if (process.env.NODE_ENV === "production") cookieParts.push("Secure");

    return new Response(
      JSON.stringify({
        redirect: false,
        token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "set-cookie": cookieParts.join("; "),
        },
      }
    );
  } catch (err) {
    console.error("POST /api/auth/sign-in/email error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
