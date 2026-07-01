import { cookies } from "next/headers";
import { cache } from "react";
import {
  COOKIE_NAME,
  verifyMockSessionJWT,
} from "@/lib/auth/mock-session";
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
 * Reads the mock session JWT from the cookie and verifies it.
 *
 * No database calls — the user identity is stored directly in the signed
 * cookie. Wrapped in `cache()` so layout + page in the same RSC request
 * only call this once.
 */
export const getAppSession = cache(async (): Promise<AppSession | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const user = await verifyMockSessionJWT(token);
  if (!user) return null;

  return { user };
});
