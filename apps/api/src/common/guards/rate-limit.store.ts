/**
 * In-memory rate-limit store — VERBATIM port of apps/web/server/middleware/
 * rateLimit.ts. A single module-level `buckets` Map is shared by both the guard
 * (IP-keyed, replaces `rateLimitMiddleware`) and `checkRateLimit` (identifier-
 * keyed, called inline by handlers such as comments/admin bulk-role), exactly as
 * the Hono module shared one map.
 *
 * Caveat (unchanged from Hono): per-instance, non-distributed — resets on deploy
 * and is not shared across serverless instances. Ported as-is per Phase 2 scope.
 */
const buckets = new Map<string, { count: number; windowStart: number }>();

function bucketKey(prefix: string, id: string): string {
  return `${prefix}:${id}`;
}

export type RateLimitRejection = {
  status: number;
  body: { error: string };
  headers: Record<string, string>;
};

/**
 * Programmatic check for handlers. Returns null on success or a rejection
 * descriptor (429) when rate limited. Identical semantics to the Hono export.
 */
export function checkRateLimit(
  prefix: string,
  identifier: string | null,
  max = 60,
  windowMs = 60_000,
): RateLimitRejection | null {
  const id = identifier ?? 'unknown';
  const key = bucketKey(prefix, id);
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return null;
  }

  if (entry.count >= max) {
    return {
      status: 429,
      body: { error: 'Too many requests' },
      headers: { 'Retry-After': String(Math.ceil(windowMs / 1000)) },
    };
  }

  entry.count += 1;
  return null;
}

/**
 * IP-keyed consume, mirroring `rateLimitMiddleware`. Returns null on success or
 * a rejection descriptor when limited.
 */
export function consumeByIp(
  prefix: string,
  ip: string,
  max: number,
  windowMs: number,
): RateLimitRejection | null {
  const key = bucketKey(prefix, ip);
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return null;
  }

  if (entry.count >= max) {
    return {
      status: 429,
      body: { error: 'Too many requests' },
      headers: { 'Retry-After': String(Math.ceil(windowMs / 1000)) },
    };
  }

  entry.count += 1;
  return null;
}
