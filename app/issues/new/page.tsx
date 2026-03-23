import prisma from "@/lib/prisma";
import { IssueType, PrismaClient, Priority, Severity } from "@prisma/client";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth/session";
import { defineAbilitiesFor } from "@/lib/casl";
import { NewIssueForm } from "@/components/issue/NewIssueForm";

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
  const type = formData.get("type") as string;
  const priority = formData.get("priority") as string;
  const severity = formData.get("severity") as string;
  const url = formData.get("url") as string;
  // Screenshots will be uploaded via client-side fetch
  const screenshotsMeta = formData.get("screenshotsMeta");
  let screenshots = [];
  if (screenshotsMeta) {
    screenshots = JSON.parse(screenshotsMeta as string);
  }

  if (!title || !description || !type || !priority || !severity) {
    redirect("/issues/new?error=missing-required-fields");
  }

  const issue = await prisma.issue.create({
    data: {
      title,
      description,
      type: type as IssueType,
      priority: priority as Priority,
      severity: severity as Severity,
      url,
      createdBy: session.user.id,
      screenshots: {
        create: screenshots.map((file: any, idx: number) => ({
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
      : "";

  return <NewIssueForm action={createIssue} errorMessage={errorMessage} />;
}
