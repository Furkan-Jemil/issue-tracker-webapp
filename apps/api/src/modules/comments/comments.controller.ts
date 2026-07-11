import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  Inject,
  Post,
} from '@nestjs/common';
import {
  CommentsService,
  createCommentSchema,
  CreateCommentInput,
} from './comments.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { checkRateLimit } from '../../common/guards/rate-limit.store';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { ServerUser } from '../../common/auth/session.service';
import { CheckPolicies } from '../../common/casl/check-policies.decorator';
import type { CreateCommentDto } from './dto';


/**
 * Ports apps/web/server/routes/comments.ts (`POST /api/comments`).
 *
 * Order mirrors the Hono handler exactly:
 *   1. Zod validation (ZodValidationPipe) → 400 `{ error: <first message> }`.
 *      Runs before the handler, matching `zValidator` middleware.
 *   2. Auth → 401.
 *   3. Rate limit → 429 (per-USER via checkRateLimit, keyed by user.id, 20/min).
 *      NOTE: Hono returns only `rate.body`+status here and IGNORES the Retry-After
 *      header, so we intentionally do NOT set it — exact parity.
 *   4. Access checks (404 / 403) inside the service.
 *
 * Uses per-user checkRateLimit (NOT the IP-keyed @RateLimit guard) because the
 * Hono limit is keyed by session.user.id and runs after auth.
 */
@Controller('api/comments')
export class CommentsController {
  constructor(
    @Inject(CommentsService) private readonly comments: CommentsService,
  ) {}

  @Post()
  @HttpCode(200)
  @CheckPolicies((ability) => ability.can('create', 'Comment'))
  async create(
    @CurrentUser() user: ServerUser | null,
    @Body(new ZodValidationPipe(createCommentSchema))
    body: CreateCommentDto | CreateCommentInput,
  ) {
    if (!user) throw new HttpException({ error: 'Unauthorized' }, 401);

    const rate = checkRateLimit('comments:post', user.id, 20, 60_000);
    if (rate) throw new HttpException(rate.body, rate.status);

    const result = await this.comments.create(user, body);
    return result.comment;
  }
}
