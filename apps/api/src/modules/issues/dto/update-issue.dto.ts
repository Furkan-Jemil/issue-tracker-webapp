import { z } from 'zod';
import { UpdateIssueSchema } from '@workspace/shared';

export type UpdateIssueDto = z.infer<typeof UpdateIssueSchema>;
export { UpdateIssueSchema };
