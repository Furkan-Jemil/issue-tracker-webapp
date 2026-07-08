import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import {
  CreateIssueSchema,
  defineAbilitiesFor,
  canTransition,
} from '@workspace/shared';
import { IssuesService } from './issues.service';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { ServerUser } from '../../common/auth/session.service';

// Uploaded-file references (from POST /api/upload) — validated separately from
// CreateIssueSchema, verbatim from routes/issues.ts.
const UploadedFileSchema = z.object({
  url: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
});

const ALLOWED_UPDATE_FIELDS = [
  'title',
  'description',
  'status',
  'priority',
  'severity',
  'type',
  'assigneeId',
];

/**
 * Ports apps/web/server/routes/issues.ts (mounted at /api/issues-mobile).
 *
 * Authorization mirrors the Hono handler order exactly: 401 (no session) →
 * CASL ability (403) → validation → ownership (403) → canTransition (400).
 *
 * IMPORTANT: POST validation returns `{ error: 'Validation failed', details:
 * <zod format()> }` — NOT the standard ZodValidationPipe body — so it is done
 * inline with the shared CreateIssueSchema, not via the pipe.
 */
@Controller('api/issues-mobile')
export class IssuesController {
  constructor(@Inject(IssuesService) private readonly issues: IssuesService) {}

  // GET /api/issues-mobile
  @Get()
  async list(@CurrentUser() user: ServerUser | null) {
    if (!user) throw new HttpException({ error: 'Unauthorized' }, 401);

    const ability = defineAbilitiesFor({ id: user.id, role: user.role as any });
    if (!ability.can('read', 'Issue')) {
      throw new HttpException({ error: 'Forbidden' }, 403);
    }

    return this.issues.listForUser(user);
  }

  // POST /api/issues-mobile
  @Post()
  @HttpCode(201)
  async create(
    @CurrentUser() user: ServerUser | null,
    @Body() body: any,
  ) {
    if (!user) throw new HttpException({ error: 'Unauthorized' }, 401);

    const ability = defineAbilitiesFor({ id: user.id, role: user.role as any });
    if (!ability.can('create', 'Issue')) {
      throw new HttpException({ error: 'Forbidden' }, 403);
    }

    if (!body || typeof body !== 'object') {
      throw new HttpException({ error: 'Invalid input' }, 400);
    }

    const result = CreateIssueSchema.safeParse(body);
    if (!result.success) {
      throw new HttpException(
        { error: 'Validation failed', details: result.error.format() },
        400,
      );
    }

    const screenshots = z
      .array(UploadedFileSchema)
      .safeParse((body as any).screenshots ?? []);
    const attachments = z
      .array(UploadedFileSchema)
      .safeParse((body as any).attachments ?? []);
    const screenshotFiles = screenshots.success ? screenshots.data : [];
    const attachmentFiles = attachments.success ? attachments.data : [];

    return this.issues.create(
      user,
      result.data,
      screenshotFiles,
      attachmentFiles,
    );
  }

  // PATCH /api/issues-mobile/:id
  @Patch(':id')
  async update(
    @CurrentUser() user: ServerUser | null,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    if (!user) throw new HttpException({ error: 'Unauthorized' }, 401);

    const ability = defineAbilitiesFor({ id: user.id, role: user.role as any });
    if (!ability.can('update', 'Issue')) {
      throw new HttpException({ error: 'Forbidden' }, 403);
    }

    if (!body || typeof body !== 'object') {
      throw new HttpException({ error: 'Invalid input' }, 400);
    }

    const existing = await this.issues.findForUpdate(id);
    if (!existing) throw new HttpException({ error: 'Issue not found' }, 404);
    if (
      user.role !== 'ADMIN' &&
      existing.createdBy !== user.id &&
      existing.assigneeId !== user.id
    ) {
      throw new HttpException({ error: 'Forbidden' }, 403);
    }

    const updateData: Record<string, any> = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (field in body) updateData[field] = body[field];
    }

    if (Object.keys(updateData).length === 0) {
      throw new HttpException({ error: 'No valid fields to update' }, 400);
    }

    const statusChanged =
      'status' in updateData && updateData.status !== existing.status;
    if (statusChanged && !canTransition(existing.status, updateData.status)) {
      throw new HttpException(
        {
          error: `Invalid status transition: ${existing.status} → ${updateData.status}`,
        },
        400,
      );
    }

    return this.issues.update(id, user, updateData, statusChanged);
  }

  // DELETE /api/issues-mobile/:id
  @Delete(':id')
  async remove(
    @CurrentUser() user: ServerUser | null,
    @Param('id') id: string,
  ) {
    if (!user) throw new HttpException({ error: 'Unauthorized' }, 401);

    const ability = defineAbilitiesFor({ id: user.id, role: user.role as any });
    if (!ability.can('delete', 'Issue')) {
      throw new HttpException({ error: 'Forbidden' }, 403);
    }

    const existing = await this.issues.findForDelete(id);
    if (!existing) throw new HttpException({ error: 'Issue not found' }, 404);
    if (
      user.role !== 'ADMIN' &&
      existing.createdBy !== user.id &&
      existing.assigneeId !== user.id
    ) {
      throw new HttpException({ error: 'Forbidden' }, 403);
    }

    return this.issues.delete(id);
  }
}
