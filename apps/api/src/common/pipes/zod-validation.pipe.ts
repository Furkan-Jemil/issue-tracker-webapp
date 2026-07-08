import {
  ArgumentMetadata,
  HttpException,
  HttpStatus,
  PipeTransform,
} from '@nestjs/common';

/**
 * Minimal structural shape of a Zod schema's `safeParse`. Declared locally so
 * the pipe accepts schemas from `@workspace/shared` regardless of which Zod
 * instance/version (v3 or v4) built them — avoids cross-version type conflicts.
 */
export interface ParsableSchema<T = unknown> {
  safeParse(input: unknown):
    | { success: true; data: T }
    | { success: false; error: { issues: Array<{ message?: string }> } };
}

/**
 * ZodValidationPipe — replaces `@hono/zod-validator`'s error hook.
 *
 * On failure it throws 400 with body `{ error: <first issue message> }`,
 * matching the Hono contract exactly:
 *   `c.json({ error: result.error.issues[0]?.message || 'Invalid input' }, 400)`
 *
 * The schema is passed to the constructor (not DI), so usage is
 * `@Body(new ZodValidationPipe(SomeSchema)) body: T`.
 */
export class ZodValidationPipe<T = unknown> implements PipeTransform {
  constructor(private readonly schema: ParsableSchema<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const message = result.error.issues[0]?.message || 'Invalid input';
      throw new HttpException({ error: message }, HttpStatus.BAD_REQUEST);
    }
    return result.data;
  }
}
