import { z } from 'zod';
import { createPaginationSchema, createSortSchema } from '../../../common/query/query-dto';

export const FilterUserSchema = createPaginationSchema()
  .merge(
    createSortSchema(
      ['name', 'email', 'role', 'createdAt'] as const,
      'name',
      'asc',
    ),
  )
  .extend({
    role: z.string().optional(),
    search: z.string().optional(),
  });

export type FilterUserDto = z.infer<typeof FilterUserSchema>;
