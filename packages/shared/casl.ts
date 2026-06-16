import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from "@casl/ability";

export type Role = "USER" | "TESTER" | "ADMIN";

export type AppSubjects =
  | "User"
  | "Issue"
  | "Comment"
  | "Notification"
  | "IssueHistory"
  | "all";

export type AppActions = "manage" | "create" | "read" | "update" | "delete";

export type AppAbility = MongoAbility<[AppActions, AppSubjects]>;

export type AuthUser = { id: string; role: Role };

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
