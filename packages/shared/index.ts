import { z } from "zod";

// Shared Issue validation schema
export const CreateIssueSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["BUG", "IMPROVEMENT"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  severity: z.enum(["MINOR", "MAJOR", "CRITICAL"]),
  // Optional at creation. assigneeId must be a valid user id; url is a reference link.
  assigneeId: z.string().uuid().optional().nullable(),
  url: z.string().url().optional().nullable(),
});

export type CreateIssueInput = z.infer<typeof CreateIssueSchema>;

export const UpdateIssueSchema = CreateIssueSchema.partial().extend({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
});

export type UpdateIssueInput = z.infer<typeof UpdateIssueSchema>;

export * from "./casl";
export * from "./routes";
export * from "./statusWorkflow";
