import { Controller, Inject, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { UploadService } from './upload.service';
import { Public } from '../../common/auth/public.decorator';
import {
  expressToWebRequest,
  writeWebResponseToExpress,
} from '../../common/http/express-web-bridge';

/**
 * Ports apps/web/server/routes/upload.ts (mounted at /api/upload).
 *
 * Both routes need the raw request body (multipart bytes / base64 JSON), so they
 * bridge Express → Web Request and call the verbatim service handlers, then write
 * the Web Response back. Auth is done inside the service via getServerSession
 * (matching Hono), so the controller is marked @Public to let the request through
 * SessionGuard unmodified — the service still returns 401 when unauthenticated.
 */
@Controller('api/upload')
@Public()
export class UploadController {
  constructor(@Inject(UploadService) private readonly upload: UploadService) {}

  // POST /api/upload
  @Post()
  async multipart(@Req() req: Request, @Res() res: Response): Promise<void> {
    const webReq = expressToWebRequest(req);
    const webRes = await this.upload.handleMultipart(webReq);
    await writeWebResponseToExpress(webRes, res);
  }

  // POST /api/upload/base64
  @Post('base64')
  async base64(@Req() req: Request, @Res() res: Response): Promise<void> {
    const webReq = expressToWebRequest(req);
    const webRes = await this.upload.handleBase64(webReq);
    await writeWebResponseToExpress(webRes, res);
  }
}
