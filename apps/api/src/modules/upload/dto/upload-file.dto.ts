import { z } from 'zod';

export const UploadFileSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  url: z.string().min(1),
});

export type UploadFileDto = z.infer<typeof UploadFileSchema>;
