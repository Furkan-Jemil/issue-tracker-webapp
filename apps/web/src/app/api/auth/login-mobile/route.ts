import { NextResponse } from "next/server";
import { createMockSessionJWT } from "@/lib/auth/mock-session";
import type { Role } from "@prisma/client";

const MOCK_USERS: Record<
  string,
  { password: string; name: string; role: Role }
> = {
  "admin@ethiotelecom.et": {
    password: "admin",
    name: "Admin",
    role: "ADMIN",
  },
  "user@ethiotelecom.et": { password: "user", name: "User", role: "USER" },
  "tester@ethiotelecom.et": {
    password: "tester",
    name: "Tester",
    role: "TESTER",
  },
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const mock = MOCK_USERS[normalizedEmail];

    if (!mock || mock.password !== password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createMockSessionJWT({
      id: normalizedEmail,
      name: mock.name,
      email: normalizedEmail,
      role: mock.role,
    });

    return NextResponse.json({
      token,
      user: {
        id: normalizedEmail,
        email: normalizedEmail,
        name: mock.name,
        role: mock.role,
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
