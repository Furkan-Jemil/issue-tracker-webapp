import {
  Controller,
  Get,
  HttpException,
  Inject,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { checkRateLimit } from '../../common/guards/rate-limit.store';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { ServerUser } from '../../common/auth/session.service';

/**
 * Ports the GET routes of apps/web/server/routes/notifications.ts.
 *
 * CRITICAL ROUTE ORDER: `@Get('unread')` is declared BEFORE `@Get(':id')` so
 * Express matches `/api/notifications/unread` to the dedicated handler instead of
 * treating "unread" as an `:id` param. Method-decorator order = registration order.
 *
 * PATCH routes (`PATCH /`, `PATCH /:id`) are writes — deferred to Phase 4.
 */
@Controller('api/notifications')
export class NotificationsController {
  constructor(
    @Inject(NotificationsService)
    private readonly notifications: NotificationsService,
  ) {}

  // GET /api/notifications
  @Get()
  async list(
    @CurrentUser() user: ServerUser | null,
    @Query('limit') limit?: string,
  ) {
    if (!user) throw new HttpException({ error: 'Unauthorized' }, 401);
    const parsed = parseInt(limit || '50', 10);
    const resolved = Number.isFinite(parsed)
      ? Math.max(1, Math.min(parsed, 100))
      : 50;
    return this.notifications.list(user.id, resolved);
  }

  // GET /api/notifications/unread  — MUST be declared before ':id'
  @Get('unread')
  async unread(@CurrentUser() user: ServerUser | null) {
    if (!user) throw new HttpException({ error: 'Unauthorized' }, 401);
    return this.notifications.unreadCount(user.id);
  }

  // GET /api/notifications/:id
  @Get(':id')
  async byId(
    @CurrentUser() user: ServerUser | null,
    @Param('id') id: string,
  ) {
    // Order matches the Hono handler: id validation (400) → auth (401) → 404.
    if (!id || typeof id !== 'string') {
      throw new HttpException({ error: 'Invalid notification id' }, 400);
    }
    if (!user) throw new HttpException({ error: 'Unauthorized' }, 401);

    const notification = await this.notifications.findById(id);
    if (!notification || notification.userId !== user.id) {
      throw new HttpException({ error: 'Not found' }, 404);
    }
    return { notification };
  }

  // PATCH /api/notifications — mark all as read (rate limit: 30/min per user)
  @Patch()
  async markAll(@CurrentUser() user: ServerUser | null) {
    if (!user) throw new HttpException({ error: 'Unauthorized' }, 401);

    const rate = checkRateLimit('notifications:patch-all', user.id, 30, 60_000);
    if (rate) throw new HttpException(rate.body, rate.status);

    return this.notifications.markAllRead(user.id);
  }

  // PATCH /api/notifications/:id — mark one as read (rate limit: 60/min per user)
  @Patch(':id')
  async markOne(
    @CurrentUser() user: ServerUser | null,
    @Param('id') id: string,
  ) {
    // Order matches Hono: id validation (400) → auth (401) → rate (429) → 404.
    if (!id || typeof id !== 'string') {
      throw new HttpException({ error: 'Invalid notification id' }, 400);
    }
    if (!user) throw new HttpException({ error: 'Unauthorized' }, 401);

    const rate = checkRateLimit('notifications:patch-one', user.id, 60, 60_000);
    if (rate) throw new HttpException(rate.body, rate.status);

    const notif = await this.notifications.findOwnership(id);
    if (!notif || notif.userId !== user.id) {
      throw new HttpException({ error: 'Not found' }, 404);
    }

    return this.notifications.markOneRead(id);
  }
}
