import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * AllExceptionsFilter — guarantees every error leaves the service as clean JSON.
 *
 * - HttpException: emit its response as-is. Our guards/pipe throw
 *   `new HttpException({ error: msg }, status)`, so the body is already the
 *   contract shape `{ error: string }`. A string payload is wrapped as
 *   `{ error: string }`.
 * - Anything else (truly unhandled): 500 `{ error: 'Internal server error' }`,
 *   matching the Hono route-level catch blocks.
 *
 * Individual handlers keep their own try/catch + specific bodies; this is the
 * final safety net, not the primary error path.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const body =
        typeof payload === 'string' ? { error: payload } : payload;
      res.status(status).json(body);
      return;
    }

    console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, exception);
    res.status(500).json({ error: 'Internal server error' });
  }
}
