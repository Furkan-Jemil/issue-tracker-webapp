import {
  ArgumentMetadata,
  HttpException,
  HttpStatus,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import type { ParsableSchema } from './zod-validation.pipe';

/**
 * ZodQueryValidationPipe — validates and coerces query parameters via Zod schemas.
 *
 * Provides forgiving query coercion while ensuring strict validation against
 * whitelisted fields and ranges. Throws 400 Bad Request with descriptive JSON
 * error payload on validation failure.
 */
@Injectable()
export class ZodQueryValidationPipe<T = unknown> implements PipeTransform {
  constructor(private readonly schema: ParsableSchema<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const message = result.error.issues[0]?.message || 'Invalid query parameters';
      throw new HttpException({ error: message }, HttpStatus.BAD_REQUEST);
    }
    return result.data;
  }
}
