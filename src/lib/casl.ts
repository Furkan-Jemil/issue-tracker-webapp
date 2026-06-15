import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
  type RawRuleOf,
} from "@casl/ability";
import type { Role, User } from "@prisma/client";
import prisma from "@/lib/prisma";

export type AppSubjects =
  | "User"
  | "Issue"
  | "Comment"
  | "Notification"
  | "IssueHistory"
  | "all";

export type AppActions = "manage" | "create" | "read" | "update" | "delete";

export type AppAbility = MongoAbility<[AppActions, AppSubjects]>;

type AuthUser = Pick<User, "id"> & { role: Role };

// Hardcoded fallback rules. These mirror the rows seeded into the `Permission`
// table and are used when the database is unreachable, keeping authorization
// deterministic in every environment.
export function defineAbilitiesFor(user: AuthUser | null): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(
    createMongoAbility,
  );

  if (!user) {
    // Not logged in: can only register/login
    can("create", "User");
    return build();
  }

  if (user.role === "ADMIN") {
    can("manage", "all"); // Admin can do anything
  } else {
    // Ownership/state is enforced in route handlers and queries.
    can("create", "Issue");
    can("read", "Issue");
    can("update", "Issue");
    cannot("delete", "Issue");
    // Comments, notifications, and history visibility are also server-validated.
    can("create", "Comment");
    can("read", "Comment");
    can("read", "Notification");
    can("read", "IssueHistory");
  }

  return build();
}

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
    const rules = await loadAbilityRulesFor(user.role);
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
