import { z } from 'zod';

export const FilterDashboardSchema = z.object({
  range: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d'),
});

export type FilterDashboardDto = z.infer<typeof FilterDashboardSchema>;
