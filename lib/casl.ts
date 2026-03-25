import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from "@casl/ability";
import type { Role, User } from "@prisma/client";

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

export function defineAbilitiesFor(user: AuthUser | null) {
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
