import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@workspace/database';
import type { Request, Response } from 'express';

/**
 * PrismaExceptionFilter — centralized Prisma known error mapping.
 *
 * Implements Decision (C2) for strict parity:
 * - P2002 (Unique constraint failed) -> 409 Conflict
 * - P2025 (Record not found) -> 404 Not Found (or faithful to existing contracts)
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    if (exception.code === 'P2002') {
      const target = exception.meta?.target;
      const targetStr = Array.isArray(target)
        ? target.join(', ')
        : target
          ? String(target)
          : 'record';
      res.status(HttpStatus.CONFLICT).json({
        error: `Unique constraint violation on ${targetStr}`,
      });
      return;
    }

    if (exception.code === 'P2025') {
      res.status(HttpStatus.NOT_FOUND).json({
        error: 'Record not found',
      });
      return;
    }

    console.error(
      `Unhandled Prisma error (${exception.code}) on ${req.method} ${req.originalUrl}:`,
      exception,
    );
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'Internal server error',
    });
  }
}
