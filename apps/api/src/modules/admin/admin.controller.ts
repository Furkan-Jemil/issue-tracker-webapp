import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@workspace/database';
import { AdminService } from './admin.service';
import { checkRateLimit } from '../../common/guards/rate-limit.store';
import { parseEnumValue } from '../../common/query/enum';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { ServerUser } from '../../common/auth/session.service';
import type { UpdateUserRoleDto } from './dto';


/**
 * Ports apps/web/server/routes/admin.ts (mounted at /api/admin).
 *
 * Admin authorization is enforced INLINE (not via @Roles) because the 403 bodies
 * differ per route:
 *   - GET /users              → 403 `{ users: [] }`   (NON-standard)
 *   - PATCH /users/:id/role   → 403 `{ error: 'Forbidden' }`
 *   - POST /users/bulk-role   → 403 `{ error: 'Forbidden' }`
 * All three treat "not authenticated" as 403 (not 401), matching Hono's
 * `if (!session?.user || session.user.role !== 'ADMIN')`.
 */
@Controller('api/admin')
export class AdminController {
  constructor(@Inject(AdminService) private readonly admin: AdminService) {}

  // GET /api/admin/users
  @Get('users')
  async listUsers(
    @CurrentUser() user: ServerUser | null,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if (!user || user.role !== 'ADMIN') {
      throw new HttpException({ users: [] }, 403);
    }

    const parsedSearch = (search || '').trim();
    const parsedRole = parseEnumValue(role ?? null, Object.values(Role));
    const parsedPage = Math.max(1, Number(page || '1') || 1);
    const pageSizeRaw = Number(pageSize || '20') || 20;
    const parsedPageSize = Math.min(Math.max(pageSizeRaw, 1), 100);

    return this.admin.listUsers({
      search: parsedSearch,
      role: parsedRole,
      page: parsedPage,
      pageSize: parsedPageSize,
    });
  }

  // PATCH /api/admin/users/:id/role
  @Patch('users/:id/role')
  async updateRole(
    @CurrentUser() user: ServerUser | null,
    @Param('id') userId: string,
    @Body() body: UpdateUserRoleDto | any,
  ) {
    if (!user || user.role !== 'ADMIN') {
      throw new HttpException({ error: 'Forbidden' }, 403);
    }

    if (!body || typeof body.role !== 'string') {
      throw new HttpException({ error: 'Invalid input' }, 400);
    }

    const parsedRole = parseEnumValue(body.role, Object.values(Role));
    if (!parsedRole) throw new HttpException({ error: 'Invalid role' }, 400);

    const target = await this.admin.getUser(userId);
    if (!target) throw new HttpException({ error: 'User not found' }, 404);

    if (userId === user.id && parsedRole !== Role.ADMIN) {
      throw new HttpException(
        { error: 'Cannot remove your own admin role' },
        400,
      );
    }

    if (target.role === Role.ADMIN && parsedRole !== Role.ADMIN) {
      const adminCount = await this.admin.countAdmins();
      if (adminCount <= 1) {
        throw new HttpException(
          { error: 'At least one admin must remain' },
          400,
        );
      }
    }

    return this.admin.updateRole(userId, parsedRole);
  }

  // POST /api/admin/users/bulk-role
  @Post('users/bulk-role')
  @HttpCode(200)
  async bulkRole(@CurrentUser() user: ServerUser | null, @Body() body: any) {
    if (!user || user.role !== 'ADMIN') {
      throw new HttpException({ error: 'Forbidden' }, 403);
    }

    const rate = checkRateLimit(
      'admin-users-bulk-role:post',
      user.id,
      10,
      60_000,
    );
    if (rate) throw new HttpException(rate.body, rate.status);

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new HttpException({ error: 'Invalid input' }, 400);
    }

    const ids = 'ids' in body ? body.ids : null;
    const parsedRole = parseEnumValue(
      'role' in body ? body.role : null,
      Object.values(Role),
    );
    if (!Array.isArray(ids) || !parsedRole) {
      throw new HttpException({ error: 'Invalid input' }, 400);
    }

    const uniqueIds = Array.from(
      new Set(
        ids
          .map((id: any) => (typeof id === 'string' ? id.trim() : ''))
          .filter(Boolean),
      ),
    );
    if (uniqueIds.length === 0 || uniqueIds.length > 500) {
      throw new HttpException({ error: 'Invalid ids list' }, 400);
    }

    const targetUsers = await this.admin.getUsersByIds(uniqueIds);
    if (targetUsers.length !== uniqueIds.length) {
      throw new HttpException(
        { error: 'One or more user IDs do not exist' },
        400,
      );
    }

    if (uniqueIds.includes(user.id) && parsedRole !== Role.ADMIN) {
      throw new HttpException(
        { error: 'Cannot remove your own admin role in bulk update' },
        400,
      );
    }

    if (parsedRole !== Role.ADMIN) {
      const adminsToDemote = targetUsers.filter(
        (u) => u.role === Role.ADMIN,
      ).length;
      if (adminsToDemote > 0) {
        const totalAdmins = await this.admin.countAdmins();
        if (totalAdmins - adminsToDemote < 1) {
          throw new HttpException(
            { error: 'At least one admin must remain' },
            400,
          );
        }
      }
    }

    const updateResult = await this.admin.bulkUpdateRole(uniqueIds, parsedRole);
    if (updateResult.count !== uniqueIds.length) {
      throw new HttpException(
        { error: 'Bulk update did not apply to all requested users' },
        409,
      );
    }

    return { success: true, updatedCount: updateResult.count };
  }
}
