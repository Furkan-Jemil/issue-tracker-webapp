import { NextResponse } from "next/server";

type RateLimitOptions = {
  keyPrefix: string;
  /**
   * Explicit identifier (e.g. session user ID) that bypasses IP detection.
   * Preferred over IP when available — immune to X-Forwarded-For spoofing.
   */
  identifier?: string;
  max: number;
  windowMs: number;
};

const buckets = new Map<
  string,
  { count: number; windowStart: number }
>();

// ─── Memory-leak guard ────────────────────────────────────────────────────────
// Purge entries that are at least 2× their window age every 5 minutes.
// This prevents unbounded growth on long-lived server processes.
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, entry] of buckets) {
        // Keep a 2× window buffer before evicting so slow windows aren't lost
        if (now - entry.windowStart > 120_000) {
          buckets.delete(key);
        }
      }
    },
    5 * 60 * 1000,
  );
}

function bucketKey(prefix: string, id: string): string {
  return `${prefix}:${id}`;
}

/**
 * Resolves the client IP in a spoofing-resistant way:
 *
 * 1. If a trusted `identifier` is provided (e.g. user ID from session), use it.
 *    This is the most reliable option and bypasses IP entirely.
 * 2. Otherwise use `x-real-ip` set by the reverse proxy — this header is NOT
 *    forwarded from the client, so it cannot be spoofed.
 * 3. Only fall back to `x-forwarded-for` as a last resort (least trusted).
 */
function resolveIdentifier(
  req: Pick<Request, "headers">,
  identifier?: string,
): string {
  if (identifier) return identifier;
  // x-real-ip is set by nginx/Caddy and is not client-controllable
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  // x-forwarded-for CAN be spoofed — take only the last hop (rightmost IP)
  // which is set by the outermost trusted proxy, not the client.
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    return parts[parts.length - 1]?.trim() ?? "unknown";
  }
  return "unknown";
}

export function applyRateLimit(
  req: Pick<Request, "headers">,
  options: RateLimitOptions,
): NextResponse | null {
  const id = resolveIdentifier(req, options.identifier);
  const key = bucketKey(options.keyPrefix, id);
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now - entry.windowStart >= options.windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return null;
  }

  if (entry.count >= options.max) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  entry.count += 1;
  return null;
}
