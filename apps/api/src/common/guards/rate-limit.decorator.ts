import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';

export type RateLimitOptions = {
  prefix: string;
  max: number;
  windowMs: number;
};

/**
 * IP-keyed rate limit for a route, enforced by RateLimitGuard. Mirrors the Hono
 * `rateLimitMiddleware(prefix, max, windowMs)` used on `/api/db-check`.
 * Handler-level, per-user limits (comments, admin bulk-role) instead call
 * `checkRateLimit(...)` inline inside their services in later phases.
 */
export const RateLimit = (prefix: string, max = 60, windowMs = 60_000) =>
  SetMetadata(RATE_LIMIT_KEY, { prefix, max, windowMs } as RateLimitOptions);
