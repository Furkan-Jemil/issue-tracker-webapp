import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { ServerUser } from './session.service';

/**
 * Injects the authenticated user resolved by SessionGuard (`req.user`), or
 * `null` when unauthenticated. Controllers replicate the exact per-endpoint
 * 401/403 contract themselves (bodies vary, e.g. `{error:'Unauthorized'}` vs
 * `{users:[]}`), matching the Hono handlers' `const session = ... await
 * getServerSession(...)` pattern.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ServerUser | null => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return (req as any).user ?? null;
  },
);
