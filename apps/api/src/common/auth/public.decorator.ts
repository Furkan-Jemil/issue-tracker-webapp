import { SetMetadata } from '@nestjs/common';

/**
 * Marks a route (or controller) as public — SessionGuard skips session
 * resolution and never rejects. Mirrors the Hono `PUBLIC_PATHS` set
 * (`/health`, `/api/health`, `/api/db-check`) plus the `/api/auth/*` prefix.
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
