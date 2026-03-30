import type { IssueType, Priority, Severity } from "@prisma/client";

export const ALLOWED_SCREENSHOT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export const MAX_SCREENSHOT_COUNT = 8;
export const MAX_SCREENSHOT_SIZE_BYTES = 5 * 1024 * 1024;

export type ScreenshotMeta = {
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
};

function normalizeField(value: FormDataEntryValue | null): string | undefined {
  if (value == null) return undefined;
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

export function parseIssueType(value: FormDataEntryValue | null): IssueType | null {
  const v = normalizeField(value)?.toUpperCase();
  if (v === "BUG" || v === "IMPROVEMENT") return v;
  return null;
}

export function parsePriority(
  value: FormDataEntryValue | null,
): Priority | null {
  const v = normalizeField(value)?.toUpperCase();
  if (v === "LOW" || v === "MEDIUM" || v === "HIGH") return v;
  return null;
}

export function parseSeverity(
  value: FormDataEntryValue | null,
): Severity | null {
  const v = normalizeField(value)?.toUpperCase();
  if (v === "MINOR" || v === "MAJOR" || v === "CRITICAL") return v;
  return null;
}

export function parseEnumValue<T extends string>(
  value: FormDataEntryValue | null,
  allowed: readonly T[],
): T | null {
  const v = normalizeField(value)?.toUpperCase() as T | undefined;
  if (v && (allowed as readonly string[]).includes(v)) return v;
  return null;
}

export function parseScreenshotMetadata(
  value: FormDataEntryValue | null,
):
  | { data: ScreenshotMeta[]; error?: undefined }
  | { data?: undefined; error: string } {
  if (value == null || value === "") {
    return { data: [] };
  }
  if (typeof value !== "string") {
    return { error: "Invalid screenshots payload" };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return { error: "Screenshots metadata is not valid JSON" };
  }
  if (!Array.isArray(parsed)) {
    return { error: "Screenshots metadata must be an array" };
  }
  if (parsed.length > MAX_SCREENSHOT_COUNT) {
    return { error: `At most ${MAX_SCREENSHOT_COUNT} screenshots allowed` };
  }
  const out: ScreenshotMeta[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") {
      return { error: "Invalid screenshot entry" };
    }
    const rec = item as Record<string, unknown>;
    const url = typeof rec.url === "string" ? rec.url.trim() : "";
    const filename = typeof rec.filename === "string" ? rec.filename.trim() : "";
    const mimeType = typeof rec.mimeType === "string" ? rec.mimeType.trim() : "";
    const sizeBytes =
      typeof rec.sizeBytes === "number" && Number.isFinite(rec.sizeBytes)
        ? rec.sizeBytes
        : NaN;
    if (!url || !filename || !mimeType || !Number.isFinite(sizeBytes)) {
      return { error: "Screenshot entry missing required fields" };
    }
    if (
      !(ALLOWED_SCREENSHOT_MIME_TYPES as readonly string[]).includes(mimeType)
    ) {
      return { error: "Unsupported screenshot MIME type" };
    }
    if (sizeBytes < 0 || sizeBytes > MAX_SCREENSHOT_SIZE_BYTES) {
      return { error: "Invalid screenshot size" };
    }
    out.push({ url, filename, mimeType, sizeBytes });
  }
  return { data: out };
}
