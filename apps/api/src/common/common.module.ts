import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SessionService } from './auth/session.service';
import { SessionGuard } from './auth/session.guard';
import { RolesGuard } from './auth/roles.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { CaslModule } from './casl/casl.module';
import { PoliciesGuard } from './casl/policies.guard';

/**
 * CommonModule — cross-cutting infrastructure (Phase 2).
 *
 * Registers four GLOBAL guards. Order matters and is preserved by the provider
 * array order:
 *   1. SessionGuard   — resolves + attaches req.user (never blocks)
 *   2. RateLimitGuard — no-op unless @RateLimit present
 *   3. RolesGuard     — no-op unless @Roles present (needs req.user from #1)
 *   4. PoliciesGuard  — no-op unless @CheckPolicies present (needs req.user from #1)
 */
@Module({
  imports: [CaslModule],
  providers: [
    SessionService,
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PoliciesGuard },
  ],
  exports: [SessionService, CaslModule],
})
export class CommonModule {}
