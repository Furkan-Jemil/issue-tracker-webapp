import { z } from 'zod';
import { createPaginationSchema, createSortSchema } from '../../../common/query/query-dto';

export const FilterIssueSchema = createPaginationSchema()
  .merge(
    createSortSchema(
      ['createdAt', 'priority', 'severity', 'status', 'title'] as const,
      'createdAt',
      'desc',
    ),
  )
  .extend({
    status: z.string().optional(),
    priority: z.string().optional(),
    severity: z.string().optional(),
    type: z.string().optional(),
    search: z.string().optional(),
    assigneeId: z.string().optional(),
  });

export type FilterIssueDto = z.infer<typeof FilterIssueSchema>;
