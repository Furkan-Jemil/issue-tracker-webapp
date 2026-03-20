import {
  AbilityBuilder,
  AbilityClass,
  PureAbility,
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

export type AppAbility = PureAbility<[AppActions, AppSubjects]>;

type AuthUser = Pick<User, "id"> & { role: Role };

export function defineAbilitiesFor(user: AuthUser | null) {
  const { can, cannot, build } = new AbilityBuilder<
    PureAbility<[AppActions, AppSubjects]>
  >(PureAbility as AbilityClass<AppAbility>);

  if (!user) {
    // Not logged in: can only register/login
    can("create", "User");
    return build();
  }

  if (user.role === "ADMIN") {
    can("manage", "all"); // Admin can do anything
  } else {
    // User/Tester: can manage own issues, but only update if status is OPEN
    can("create", "Issue");
    can("read", "Issue", { createdBy: user.id });
    can("update", "Issue", { createdBy: user.id, status: "OPEN" });
    cannot("delete", "Issue");
    // Comments, notifications, etc. (own only)
    can("create", "Comment");
    can("read", "Comment", { userId: user.id });
    can("read", "Notification", { userId: user.id });
    can("read", "IssueHistory", { actorId: user.id });
  }

  return build();
}
