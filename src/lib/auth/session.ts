import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { headers } from "next/headers";
import { cache } from "react";

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
 * Resolves the Better Auth session and loads `role` (and normalized user fields)
 * from the database so call sites match the app’s Prisma `User` model.
 *
 * Wrapped in `cache()` so layout + page in the same RSC request only hit the DB once.
 */
export const getAppSession = cache(async (): Promise<AppSession | null> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    return null;
  }

  return { user };
});
