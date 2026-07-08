import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { buildCorsOptions } from './common/cors/cors.config';

/**
 * Local / Node entrypoint. Boots NestJS (Express) on `PORT || 4000` — a drop-in
 * for the Hono server's `server:start`.
 *
 * BODY PARSING (Phase 5): the auth and upload handlers need the RAW request body
 * to rebuild a Web `Request` (JSON, form, or multipart bytes). Nest's default
 * JSON parser would consume the stream first, so we disable it (`bodyParser:
 * false`) and register parsers manually:
 *   - `express.raw` (all content-types) scoped to /api/auth and /api/upload FIRST
 *     — captures the exact bytes into `req.body` (a Buffer) and sets body-parser's
 *     `_body` flag so the JSON parser below skips those paths.
 *   - `express.json` + `express.urlencoded` for every OTHER route, so the Phase
 *     3/4 controllers keep receiving parsed `@Body()` objects.
 *
 * Upload limit is generous to cover the max multipart payload (8×5MB + 10×10MB).
 */
const RAW_BODY_LIMIT = '160mb';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
    bodyParser: false,
  });

  app.enableCors(buildCorsOptions());

  // Parity shim: Hono corsMiddleware returned 204 for EVERY OPTIONS (headers only
  // for allowed origins). Runs after cors to catch disallowed-origin preflights
  // that Nest's cors would otherwise 404.
  app.use((req: Request, res: Response, next: () => void) => {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
    next();
  });

  // Raw body for the bridge routes (must be registered BEFORE express.json).
  app.use('/api/auth', express.raw({ type: () => true, limit: RAW_BODY_LIMIT }));
  app.use('/api/upload', express.raw({ type: () => true, limit: RAW_BODY_LIMIT }));

  // Parsed body for all other routes.
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = Number(process.env.PORT || 4000);
  const host = process.env.HOST || '0.0.0.0';

  await app.listen(port, host);
  // eslint-disable-next-line no-console
  console.log(`[api] NestJS listening on http://${host}:${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[api] Fatal bootstrap error:', err);
  process.exit(1);
});
