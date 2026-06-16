import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Authenticate with Better-Auth email provider
    let signInRes;
    try {
      signInRes = await auth.api.signInEmail({
        body: {
          email,
          password,
        },
      });
    } catch (authError: any) {
      return NextResponse.json(
        { error: authError.message || "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!signInRes || !signInRes.user) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Retrieve the session token from the database
    const session = await prisma.session.findFirst({
      where: { userId: signInRes.user.id },
      orderBy: { expiresAt: "desc" },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Failed to retrieve session token" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      token: session.token,
      user: {
        id: signInRes.user.id,
        email: signInRes.user.email,
        name: signInRes.user.name,
        role: (signInRes.user as any).role,
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
