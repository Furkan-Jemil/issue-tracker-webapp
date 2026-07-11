import { z } from 'zod';
import { createPaginationSchema, createSortSchema } from '../../../common/query/query-dto';

export const FilterAuditLogSchema = createPaginationSchema()
  .merge(
    createSortSchema(
      ['createdAt', 'eventType'] as const,
      'createdAt',
      'desc',
    ),
  )
  .extend({
    issueId: z.string().optional(),
    actorId: z.string().optional(),
    eventType: z.string().optional(),
  });

export type FilterAuditLogDto = z.infer<typeof FilterAuditLogSchema>;
