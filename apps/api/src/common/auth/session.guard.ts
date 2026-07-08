import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import { SessionService } from './session.service';
import { toWebHeaders } from './headers.util';

/**
 * SessionGuard — global guard that ports the Hono `sessionMiddleware`.
 *
 * Behaviour parity: it RESOLVES the session and attaches it to the request
 * (`req.session`, `req.user`) but NEVER rejects. The Hono middleware likewise
 * only attaches `c.session`; each route handler emits its own 401/403 with its
 * own body. Enforcement therefore stays in controllers (via @CurrentUser) and in
 * RolesGuard — not here — so every endpoint keeps its exact contract.
 *
 * Public routes (@Public) and the `/api/auth/*` prefix skip resolution entirely,
 * mirroring `PUBLIC_PATHS` + the auth-prefix check in sessionMiddleware.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(SessionService) private readonly sessions: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const pathname = (req.path || req.url || '').split('?')[0];
    const isAuthPrefix =
      pathname === '/api/auth' || pathname.startsWith('/api/auth/');

    if (isPublic || isAuthPrefix) {
      return true;
    }

    try {
      const headers = toWebHeaders(req.headers);
      const session = await this.sessions.getServerSession(headers);
      (req as any).session = session ?? undefined;
      (req as any).user = session?.user ?? undefined;
    } catch (err) {
      // Match sessionMiddleware: swallow errors, continue unauthenticated.
      console.warn('session guard error', err);
    }

    return true;
  }
}
