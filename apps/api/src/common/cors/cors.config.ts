import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * Dynamic allowed-origin resolution — VERBATIM port of
 * apps/web/server/middleware/cors.ts `getAllowedOrigins()`.
 */
export function getAllowedOrigins(): string[] {
  const origins = new Set<string>(['http://localhost:3000']);

  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean)
      .forEach((o) => origins.add(o));
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.add(process.env.NEXT_PUBLIC_APP_URL.trim());
  }

  return Array.from(origins);
}

/**
 * CORS options mirroring corsMiddleware():
 *   - reflect Origin only when in the allowlist (else no CORS headers),
 *   - credentials: true, Vary: Origin (cors lib adds it for a function origin),
 *   - methods GET,POST,PUT,PATCH,DELETE,OPTIONS; headers Content-Type, Authorization,
 *   - preflight OPTIONS → 204 (matches the Hono `new Response('ok', {status:204})`).
 *
 * Requests with no Origin (mobile / same-origin) are allowed through without
 * CORS headers, exactly as the Hono middleware did (it only added headers when
 * an allowed Origin was present, and otherwise called `next()`).
 */
export function buildCorsOptions(): CorsOptions {
  const allowed = getAllowedOrigins();
  return {
    origin(origin, callback) {
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  };
}
