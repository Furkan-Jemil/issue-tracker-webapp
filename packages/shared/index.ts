import { z } from "zod";

// Shared Issue validation schema
export const CreateIssueSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["BUG", "IMPROVEMENT"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  severity: z.enum(["MINOR", "MAJOR", "CRITICAL"]),
});

export type CreateIssueInput = z.infer<typeof CreateIssueSchema>;

export * from "./casl";
export * from "./routes";
