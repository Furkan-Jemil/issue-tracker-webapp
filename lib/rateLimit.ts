import { NextResponse } from "next/server";

type RateLimitOptions = {
  keyPrefix: string;
  identifier?: string;
  max: number;
  windowMs: number;
};

const buckets = new Map<
  string,
  { count: number; windowStart: number }
>();

function bucketKey(prefix: string, id: string): string {
  return `${prefix}:${id}`;
}

export function applyRateLimit(
  req: Pick<Request, "headers">,
  options: RateLimitOptions,
): NextResponse | null {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip =
    options.identifier ??
    (forwarded ? forwarded.split(",")[0]?.trim() : null) ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const key = bucketKey(options.keyPrefix, ip);
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
