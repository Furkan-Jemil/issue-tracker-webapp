import type { Role } from "@prisma/client";

/**
 * Where to send someone after they are signed in.
 *
 * | Role   | Route        | Purpose                                                |
 * |--------|--------------|--------------------------------------------------------|
 * | ADMIN  | `/dashboard` | Metrics, charts, workspace overview                    |
 * | USER   | `/dashboard` | Personal dashboard scoped to own issues                |
 * | TESTER | `/dashboard` | Personal dashboard scoped to own issues                |
 *
 * Admins can always open Issues, Admin, Settings, Audit Log from the header.
 */
export function getPostLoginPath(role: Role): string {
  return "/dashboard";
}
