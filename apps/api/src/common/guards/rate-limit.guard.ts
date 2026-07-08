import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { RATE_LIMIT_KEY, RateLimitOptions } from './rate-limit.decorator';
import { consumeByIp } from './rate-limit.store';

/**
 * RateLimitGuard — IP-keyed limiter for routes annotated with @RateLimit(...).
 * Ports `rateLimitMiddleware`: client IP is resolved from `x-forwarded-for`
 * (first hop) → `x-real-ip` → 'unknown'. On limit it sets `Retry-After` and
 * throws 429 `{ error: 'Too many requests' }` (body emitted by AllExceptionsFilter).
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const opts = this.reflector.getAllAndOverride<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!opts) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const forwarded = req.headers['x-forwarded-for'];
    const forwardedFirst = Array.isArray(forwarded)
      ? forwarded[0]
      : typeof forwarded === 'string'
        ? forwarded.split(',')[0]?.trim()
        : null;
    const realIp = req.headers['x-real-ip'];
    const ip =
      forwardedFirst ??
      (Array.isArray(realIp) ? realIp[0] : realIp) ??
      'unknown';

    const rejection = consumeByIp(opts.prefix, ip, opts.max, opts.windowMs);
    if (rejection) {
      for (const [k, v] of Object.entries(rejection.headers)) {
        res.header(k, v);
      }
      throw new HttpException(rejection.body, rejection.status);
    }

    return true;
  }
}
