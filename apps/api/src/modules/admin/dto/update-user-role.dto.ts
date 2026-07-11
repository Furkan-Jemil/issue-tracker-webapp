import { z } from 'zod';

export const UpdateUserRoleSchema = z.object({
  role: z.enum(['USER', 'TESTER', 'ADMIN']),
});

export type UpdateUserRoleDto = z.infer<typeof UpdateUserRoleSchema>;
