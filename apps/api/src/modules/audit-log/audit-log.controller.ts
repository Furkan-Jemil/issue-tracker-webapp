import { Controller, Get, HttpException, Inject, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { ServerUser } from '../../common/auth/session.service';

/**
 * Ports apps/web/server/routes/audit-log.ts. Query parsing mirrors the Hono
 * handler exactly: `event` (blank/ALL = no filter), trimmed `q`, `page`
 * (>=1), `pageSize` (clamped 1..200).
 */
@Controller('api/audit-log')
export class AuditLogController {
  constructor(
    @Inject(AuditLogService) private readonly auditLog: AuditLogService,
  ) {}

  // GET /api/audit-log
  @Get()
  async list(
    @CurrentUser() user: ServerUser | null,
    @Query('event') event?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if (!user) throw new HttpException({ error: 'Unauthorized' }, 401);

    const parsedPage = Math.max(1, Number(page || '1') || 1);
    const parsedPageSize = Math.min(
      Math.max(Number(pageSize || '50') || 50, 1),
      200,
    );

    return this.auditLog.list(
      {
        event: event || '',
        q: q?.trim() || '',
        page: parsedPage,
        pageSize: parsedPageSize,
      },
      user,
    );
  }
}
