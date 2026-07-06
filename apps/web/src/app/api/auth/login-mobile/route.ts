export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json().catch(() => ({}));
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
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
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

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
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const sessionToken = randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: { userId: user.id, token: sessionToken, expiresAt },
    });

    return NextResponse.json({
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error("Mobile login endpoint error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
