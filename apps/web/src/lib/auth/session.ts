import { cookies } from "next/headers";
import { cache } from "react";
import prisma from "@/lib/prisma";
import type { Role } from "@prisma/client";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AppSession = {
  user: AppUser;
};

/**
 * Reads the session token from cookies and verifies it against the real database.
 * Wrapped in `cache()` so layout + page in the same RSC request only call this once.
 */
export const getAppSession = cache(async (): Promise<AppSession | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("better-auth.session_token")?.value;
  if (!token) return null;

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
