import {
  createMongoAbility,
  type RawRuleOf,
} from "@casl/ability";
import type { Role } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  AppSubjects,
  AppActions,
  AppAbility,
  AuthUser,
  defineAbilitiesFor,
} from "@workspace/shared";

// Re-export shared types and fallback function so Next.js callers don't break
export { defineAbilitiesFor };
export type { AppSubjects, AppActions, AppAbility, AuthUser };

/**
 * Loads CASL ability rules for a given role from the database `Permission` table.
 * Returns plain CASL rule objects that can be passed to `createMongoAbility`.
 */
export async function loadAbilityRulesFor(
  role: Role,
): Promise<RawRuleOf<AppAbility>[]> {
  const permissions = await prisma.permission.findMany({
    where: { role },
    select: { action: true, subject: true, inverted: true },
  });

  return permissions.map((permission) => ({
    action: permission.action as AppActions,
    subject: permission.subject as AppSubjects,
    inverted: permission.inverted,
  }));
}

/**
 * Database-driven version of `defineAbilitiesFor`.
 *
 * Reads the rule set for the user's role from the `Permission` table and builds
 * a CASL ability from it. If no rows exist for the role (or the query fails),
 * it falls back to the hardcoded `defineAbilitiesFor` rules so authorization
 * never silently denies everything.
 */
export async function defineAbilitiesForAsync(
  user: AuthUser | null,
): Promise<AppAbility> {
  if (!user) {
    return defineAbilitiesFor(null);
  }

  try {
    const rules = await loadAbilityRulesFor(user.role as any);
    if (rules.length === 0) {
      return defineAbilitiesFor(user);
    }
    return createMongoAbility<AppAbility>(rules);
  } catch (error) {
    console.error(
      "defineAbilitiesForAsync: failed to load rules from DB, using fallback",
      error,
    );
    return defineAbilitiesFor(user);
  }
}
