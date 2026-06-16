import type { IssueStatus, Priority, Severity } from "@prisma/client";

function normalizeParam(value: string | null | undefined): string | undefined {
  const t = value?.trim();
  return t && t.length > 0 ? t : undefined;
}

export function parseIssueStatus(
  value: string | null | undefined,
): IssueStatus | undefined {
  const v = normalizeParam(value)?.toUpperCase();
  if (
    v === "OPEN" ||
    v === "IN_PROGRESS" ||
    v === "RESOLVED" ||
    v === "CLOSED"
  ) {
    return v;
  }
  return undefined;
}

export function parsePriority(
  value: string | null | undefined,
): Priority | undefined {
  const v = normalizeParam(value)?.toUpperCase();
  if (v === "LOW" || v === "MEDIUM" || v === "HIGH") {
    return v;
  }
  return undefined;
}

export function parseSeverity(
  value: string | null | undefined,
): Severity | undefined {
  const v = normalizeParam(value)?.toUpperCase();
  if (v === "MINOR" || v === "MAJOR" || v === "CRITICAL") {
    return v;
  }
  return undefined;
}

export function parseDashboardRange(
  value: string | null | undefined,
): "7d" | "30d" | "90d" | "365d" | undefined {
  const v = normalizeParam(value)?.toLowerCase();
  if (v === "7d" || v === "30d" || v === "90d" || v === "365d") {
    return v;
  }
  return undefined;
}
