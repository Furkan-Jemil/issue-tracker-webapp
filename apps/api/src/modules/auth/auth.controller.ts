import { All, Controller, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../../common/auth/public.decorator';
import {
  expressToWebRequest,
  writeWebResponseToExpress,
} from '../../common/http/express-web-bridge';
import { authHandler } from './auth.handler';

/**
 * Ports apps/web/server/routes/auth.ts, mounted at /api/auth.
 *
 * Hono declared `.all('/')` and `.all('/*')`; we mirror that with `@All()`
 * (base path) and `@All('*')` (all sub-paths). Marked `@Public` so SessionGuard
 * skips it (the guard already bypasses the /api/auth prefix, but this is explicit).
 *
 * The controller only bridges: Express req → Web Request → authHandler → Web
 * Response → Express res. All auth logic lives in the verbatim authHandler.
 */
@Controller('api/auth')
@Public()
export class AuthController {
  @All()
  async base(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.handle(req, res);
  }

  @All('*')
  async wildcard(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.handle(req, res);
  }

  private async handle(req: Request, res: Response): Promise<void> {
    const webReq = expressToWebRequest(req);
    const webRes = await authHandler(webReq);
    await writeWebResponseToExpress(webRes, res);
  }
}
