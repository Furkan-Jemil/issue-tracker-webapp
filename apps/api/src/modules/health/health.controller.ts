import { Controller, Get, Inject, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Public } from '../../common/auth/public.decorator';
import { RateLimit } from '../../common/guards/rate-limit.decorator';

/**
 * Health / connectivity endpoints — 1:1 port of the Hono routes.
 *
 * Contract parity (verified against apps/web/server):
 *   - GET /health        → { ok: true }                    (app.ts inline route)
 *   - GET /api/health    → { status, db, uptimeMs, timestamp }, 503 on db failure
 *                          (routes/health.ts)
 *   - GET /api/db-check  → { db: 'ok' }, 500 { db:'error', message } on failure
 *                          (app.ts inline route; rate limit deferred to Phase 2)
 *
 * Paths are declared in full here because the app uses no global prefix — every
 * existing route already carries its own `/api/...` (or bare `/health`) path.
 */
@Controller()
@Public()
export class HealthController {
  // Explicit @Inject token: we run under `tsx` (esbuild), which does NOT emit
  // `design:paramtypes` decorator metadata, so Nest cannot infer constructor
  // types for DI. Annotating the token makes injection metadata-independent.
  // This is the project-wide convention for `apps/api` — see PrismaService.
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  // GET /health — liveness probe. Mirrors app.ts `app.get('/health', ...)`.
  @Get('health')
  liveness(): { ok: true } {
    return { ok: true };
  }

  // GET /api/health — readiness probe with a real DB round-trip.
  @Get('api/health')
  async health(@Res({ passthrough: true }) res: Response) {
    const startedAt = Date.now();
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        db: 'ok',
        uptimeMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Health check failed', error);
      res.status(503);
      return {
        status: 'degraded',
        db: 'error',
        uptimeMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // GET /api/db-check — connectivity probe. Mirrors app.ts inline handler,
  // including its `rateLimitMiddleware('db-check', 60, 60_000)` (now @RateLimit).
  @Get('api/db-check')
  @RateLimit('db-check', 60, 60_000)
  async dbCheck(@Res({ passthrough: true }) res: Response) {
    try {
      await this.prisma.client.$connect();
      await this.prisma.client.$disconnect();
      return { db: 'ok' };
    } catch (err) {
      res.status(500);
      return { db: 'error', message: String(err) };
    }
  }
}
