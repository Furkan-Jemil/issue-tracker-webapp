import prisma from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth/session";
import { defineAbilitiesFor } from "@/lib/casl";
import { NewIssueForm } from "@/components/issue/NewIssueForm";
import {
  parseIssueType,
  parsePriority,
  parseScreenshotMetadata,
  parseSeverity,
} from "@/lib/issueValidation";

function formatRole(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

async function createIssue(formData: FormData) {
  "use server";
  const session = await getAppSession();
  if (!session?.user) {
    redirect("/login");
  }
  const ability = defineAbilitiesFor(session.user);
  if (!ability.can("create", "Issue")) {
    throw new Error("Not authorized");
  }
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const rawType = formData.get("type");
  const rawPriority = formData.get("priority");
  const rawSeverity = formData.get("severity");
  const url = formData.get("url") as string;

  if (!title || !description || !rawType || !rawPriority || !rawSeverity) {
    redirect("/issues/new?error=missing-required-fields");
  }

  const type = parseIssueType(rawType);
  const priority = parsePriority(rawPriority);
  const severity = parseSeverity(rawSeverity);
  if (!type || !priority || !severity) {
    redirect("/issues/new?error=invalid-enum");
  }

  const screenshotsParseResult = parseScreenshotMetadata(
    formData.get("screenshotsMeta"),
  );
  if (screenshotsParseResult.error) {
    redirect("/issues/new?error=invalid-screenshots-meta");
  }

  const screenshots = screenshotsParseResult.data;

  const issue = await prisma.issue.create({
    data: {
      title,
      description,
      type,
      priority,
      severity,
      url,
      createdBy: session.user.id,
      screenshots: {
        create: screenshots.map((file, idx: number) => ({
          url: file.url,
          filename: file.filename,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
          order: idx,
        })),
      },
    },
    include: { screenshots: true },
  });

  await prisma.issueHistory.create({
    data: {
      issueId: issue.id,
      actorId: session.user.id,
      eventType: "CREATED",
      description: `Issue created by ${session.user.name || "Unknown"} (${formatRole(session.user.role)})`,
      metadata: {
        title: issue.title,
        type: issue.type,
        priority: issue.priority,
        severity: issue.severity,
        screenshotCount: issue.screenshots.length,
      },
    },
  });

  redirect("/issues");
}

export default async function NewIssuePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage =
    params?.error === "missing-required-fields"
      ? "All required fields must be filled."
      : params?.error === "invalid-enum"
        ? "Invalid issue type, priority, or severity."
        : params?.error === "invalid-screenshots-meta"
          ? "Invalid screenshot metadata. Please retry upload."
          : "";

  return <NewIssueForm action={createIssue} errorMessage={errorMessage} />;
}
