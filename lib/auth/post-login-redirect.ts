import type { Role } from "@prisma/client";

/**
 * Where to send someone after they are signed in.
 *
 * | Role   | Route        | Purpose                                      |
 * |--------|--------------|----------------------------------------------|
 * | ADMIN  | `/dashboard` | Metrics, charts, workspace overview          |
 * | USER   | `/issues`    | Own issues — report & track work             |
 * | TESTER | `/issues`    | Same queue (filters/search as permissions allow) |
 *
 * Admins can always open Issues, Admin, Settings, Audit Log from the header.
 */
export function getPostLoginPath(role: Role): string {
  if (role === "ADMIN") {
    return "/dashboard";
  }
  return "/issues";
}
