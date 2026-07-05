// Canonical issue status-transition workflow, shared by the mobile UI and the
// Hono backend so both enforce the exact same rules (single source of truth).

export type IssueStatusValue = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

// Allowed *next* states for each status. A status can never transition to
// itself (that is a no-op, handled by callers).
export const STATUS_TRANSITIONS: Record<IssueStatusValue, IssueStatusValue[]> = {
  OPEN: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["RESOLVED", "OPEN"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: ["OPEN"],
};

export const ISSUE_STATUSES: IssueStatusValue[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

export function isIssueStatus(value: unknown): value is IssueStatusValue {
  return (
    typeof value === "string" &&
    (ISSUE_STATUSES as string[]).includes(value)
  );
}

/**
 * Returns true when moving from `from` to `to` is permitted. Staying on the
 * same status is always allowed (no-op). Unknown statuses are rejected.
 */
export function canTransition(from: unknown, to: unknown): boolean {
  if (!isIssueStatus(from) || !isIssueStatus(to)) return false;
  if (from === to) return true;
  return STATUS_TRANSITIONS[from].includes(to);
}
