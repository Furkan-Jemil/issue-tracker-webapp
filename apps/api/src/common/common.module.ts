import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SessionService } from './auth/session.service';
import { SessionGuard } from './auth/session.guard';
import { RolesGuard } from './auth/roles.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';

/**
 * CommonModule — cross-cutting infrastructure (Phase 2).
 *
 * Registers three GLOBAL guards. Order matters and is preserved by the provider
 * array order:
 *   1. SessionGuard   — resolves + attaches req.user (never blocks)
 *   2. RateLimitGuard — no-op unless @RateLimit present
 *   3. RolesGuard     — no-op unless @Roles present (needs req.user from #1)
 *
 * SessionService is exported so feature modules can resolve sessions directly
 * where a controller needs the raw session object (parity with handlers that
 * call `getServerSession(c.req.raw.headers)`).
 *
 * The LoggingInterceptor, AllExceptionsFilter, and CORS are wired globally in
 * main.ts (no DI dependencies, so bootstrap-time registration is cleaner).
 */
@Module({
  providers: [
    SessionService,
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [SessionService],
})
export class CommonModule {}
