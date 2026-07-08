import {
  Controller,
  Get,
  HttpException,
  Inject,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AdminExportService } from './admin-export.service';
import { checkRateLimit } from '../../common/guards/rate-limit.store';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { ServerUser } from '../../common/auth/session.service';

/**
 * Ports apps/web/server/routes/admin-export.ts (mounted at /api/admin/export).
 *
 * Order matches Hono: admin gate (403 `{error:'Forbidden'}`) → per-user rate
 * limit (`admin-export:get`, 5/min, 429 with no Retry-After) → stream. Uses @Res
 * so the service can write cursor-batched JSON directly to the socket.
 */
@Controller('api/admin/export')
export class AdminExportController {
  constructor(
    @Inject(AdminExportService) private readonly exportService: AdminExportService,
  ) {}

  // GET /api/admin/export
  @Get()
  async export(
    @CurrentUser() user: ServerUser | null,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    if (!user || user.role !== 'ADMIN') {
      throw new HttpException({ error: 'Forbidden' }, 403);
    }

    const rate = checkRateLimit('admin-export:get', user.id, 5, 60_000);
    if (rate) throw new HttpException(rate.body, rate.status);

    const url = `${req.protocol}://${req.get('host') ?? 'localhost'}${req.originalUrl}`;
    await this.exportService.export(url, res, user);
  }
}
