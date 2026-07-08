import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * LoggingInterceptor — ports apps/web/server/middleware/logging.ts.
 * Logs `METHOD URL` on entry and `METHOD URL -> STATUS ms` on completion.
 * The Hono middleware logged the full URL; we reconstruct it from the request.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const method = req.method;
    const url = `${req.protocol}://${req.get('host') ?? ''}${req.originalUrl}`;
    const start = Date.now();

    // eslint-disable-next-line no-console
    console.log(`${method} ${url}`);

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        // eslint-disable-next-line no-console
        console.log(`${method} ${url} -> ${res.statusCode} ${ms}ms`);
      }),
    );
  }
}
