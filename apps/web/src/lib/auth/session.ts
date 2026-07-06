import { cookies, headers } from "next/headers";
import { cache } from "react";
import prisma from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AppSession = {
  user: AppUser;
};

function getSecret(): Uint8Array {
  const raw =
    process.env.BETTER_AUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "production-secret-change-in-env";
  return new TextEncoder().encode(raw);
}

export async function createSessionJWT(
  user: AppUser,
  sessionToken: string
): Promise<string> {
  return new SignJWT({ ...user, sessionToken })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(getSecret());
}

/**
 * Reads the session token from cookies and verifies it.
 * Tries instant in-memory JWT verification first for blazing fast UX (zero DB blocking),
 * with a fallback to database lookup for legacy/raw session tokens.
 * Wrapped in `cache()` so layout + page in the same RSC request only call this once.
 */
export const getAppSession = cache(async (reqHeaders?: Headers): Promise<AppSession | null> => {
  let token: string | undefined;

  if (reqHeaders) {
    const authHeader = reqHeaders.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) token = authHeader.slice(7);
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get("better-auth.session_token")?.value;
    } catch {}
  }

  if (!token) {
    try {
      const headerStore = await headers();
      const authHeader = headerStore.get("authorization") || "";
      if (authHeader.startsWith("Bearer ")) token = authHeader.slice(7);
    } catch {}
  }

  if (!token) return null;

  // 1. Fast path: try verifying as a signed JWT session (instant UX, 0ms latency)
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (payload && payload.id && payload.email) {
      return {
        user: {
          id: String(payload.id),
          name: String(payload.name || payload.email),
          email: String(payload.email),
          role: (payload.role as Role) || "USER",
        },
      };
    }
  } catch {
    // Not a JWT or expired, fallback to DB lookup below
  }

  // 2. Fallback: query database directly for raw UUID tokens
  try {
    const session = await prisma.session.findUnique({
      where: { token },
      select: { userId: true, expiresAt: true },
    });
    if (!session || session.expiresAt.getTime() < Date.now()) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) return null;

    return {
      user: {
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Error reading session from DB:", error);
    return null;
  }
});
