import { z } from 'zod';
import { createCommentSchema } from '../comments.service';

export type CreateCommentDto = z.infer<typeof createCommentSchema>;
export { createCommentSchema };
