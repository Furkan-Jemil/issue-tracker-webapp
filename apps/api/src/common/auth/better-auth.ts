import { prisma } from '@workspace/database';
import { dash } from '@better-auth/infra';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

/**
 * Server-only Better Auth instance for apps/api.
 *
 * This mirrors apps/web/src/lib/auth/index.ts VERBATIM except it never loads the
 * `nextCookies()` plugin — i.e. it is permanently the `IS_HONO_SERVER === 'true'`
 * branch that the Hono server already runs. `nextCookies` is a Next.js-only
 * plugin (writes via `next/headers`); the standalone NestJS service must not pull
 * Next into its runtime. Session VALIDATION behavior (what `auth.api.getSession`
 * accepts) is identical because it depends only on the adapter + secret, not on
 * the cookie-writing plugin.
 *
 * Config parity: same trusted-origin resolution, same secret/baseURL fallbacks,
 * same conditional `dash` plugin.
 */
const defaultTrustedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3100',
  'http://127.0.0.1:3100',
  ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
];

const trustedOrigins = (
  process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(',').map((origin) =>
        origin.trim(),
      )
    : defaultTrustedOrigins
).filter(Boolean);

const dashPlugin =
  process.env.BETTER_AUTH_API_KEY != null &&
  process.env.BETTER_AUTH_API_KEY !== ''
    ? dash({
        apiUrl: process.env.BETTER_AUTH_API_URL,
        kvUrl: process.env.BETTER_AUTH_KV_URL,
        apiKey: process.env.BETTER_AUTH_API_KEY,
      })
    : null;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXTAUTH_URL,
  secret:
    process.env.BETTER_AUTH_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET,
  trustedOrigins,
  plugins: [...(dashPlugin ? [dashPlugin] : [])],
});
