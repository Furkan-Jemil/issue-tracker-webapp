import { Controller, Get, HttpException, Inject } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { ServerUser } from '../../common/auth/session.service';

/**
 * Ports apps/web/server/routes/users.ts (GET routes). PATCH /profile is a write —
 * deferred to Phase 4. Unauthorized → 401 `{ error: 'Unauthorized' }`, matching
 * each Hono handler's `if (!session?.user) return c.json({ error: 'Unauthorized' }, 401)`.
 */
@Controller('api/users')
export class UsersController {
  constructor(@Inject(UsersService) private readonly users: UsersService) {}

  // GET /api/users
  @Get()
  async list(@CurrentUser() user: ServerUser | null) {
    if (!user) throw new HttpException({ error: 'Unauthorized' }, 401);
    return this.users.listUsers();
  }

  // GET /api/users/profile
  @Get('profile')
  async profile(@CurrentUser() user: ServerUser | null) {
    if (!user) throw new HttpException({ error: 'Unauthorized' }, 401);
    const profile = await this.users.getProfile(user.id);
    if (!profile) throw new HttpException({ error: 'Not found' }, 404);
    return profile;
  }
}
