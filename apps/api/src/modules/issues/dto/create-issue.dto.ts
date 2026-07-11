import { z } from 'zod';
import { CreateIssueSchema } from '@workspace/shared';

export type CreateIssueDto = z.infer<typeof CreateIssueSchema>;
export { CreateIssueSchema };
