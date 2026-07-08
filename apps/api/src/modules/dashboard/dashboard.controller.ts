import { Controller, Get, HttpException, Inject, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { ServerUser } from '../../common/auth/session.service';

/**
 * Ports apps/web/server/routes/dashboard.ts (`GET /stats` → `/api/dashboard/stats`).
 * Query params map to `URL.searchParams.get(...)` (string | null) in the Hono
 * handler; `@Query` yields `string | undefined`, normalized to `null` here.
 */
@Controller('api/dashboard')
export class DashboardController {
  constructor(
    @Inject(DashboardService) private readonly dashboard: DashboardService,
  ) {}

  // GET /api/dashboard/stats
  @Get('stats')
  async stats(
    @CurrentUser() user: ServerUser | null,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('severity') severity?: string,
    @Query('q') q?: string,
    @Query('range') range?: string,
  ) {
    if (!user) throw new HttpException({ error: 'Unauthorized' }, 401);

    return this.dashboard.stats(
      {
        status: status ?? null,
        priority: priority ?? null,
        severity: severity ?? null,
        q: q ?? null,
        range: range ?? null,
      },
      user,
    );
  }
}
