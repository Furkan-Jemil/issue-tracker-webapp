import { z } from 'zod';
import { createPaginationSchema } from '../../../common/query/query-dto';

export const FilterNotificationSchema = createPaginationSchema().extend({
  unreadOnly: z.coerce.boolean().optional(),
});

export type FilterNotificationDto = z.infer<typeof FilterNotificationSchema>;
