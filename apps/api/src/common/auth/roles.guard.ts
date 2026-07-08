import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Role } from '@workspace/database';
import { ROLES_KEY } from './roles.decorator';
import type { ServerUser } from './session.service';

/**
 * RolesGuard — opt-in role enforcement for routes annotated with @Roles(...).
 * Runs AFTER SessionGuard (which has already populated `req.user`).
 *
 * - No @Roles metadata → allow (route is not role-gated).
 * - Unauthenticated  → 401 `{ error: 'Unauthorized' }`.
 * - Wrong role       → 403 `{ error: 'Forbidden' }`.
 *
 * These are the canonical bodies used across the Hono routes. Endpoints with a
 * non-standard 403 body enforce inline instead of using @Roles.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const user: ServerUser | undefined = (req as any).user;

    if (!user) {
      throw new HttpException({ error: 'Unauthorized' }, 401);
    }

    if (!required.includes(user.role)) {
      throw new HttpException({ error: 'Forbidden' }, 403);
    }

    return true;
  }
}
