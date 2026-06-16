import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth/session";
import { defineAbilitiesForAsync } from "@/lib/casl";
import { NewIssueForm } from "@/app/(main)/tasks/tasks-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import type { IssueStatus } from "@prisma/client";
import {
  parseAttachmentMetadata,
  parseEnumValue,
  parseIssueType,
  parsePriority,
  parseReportedAtDate,
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
  const ability = await defineAbilitiesForAsync(session.user);
  if (!ability.can("create", "Issue")) {
    throw new Error("Not authorized");
  }
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const rawType = formData.get("type");
  const rawPriority = formData.get("priority");
  const rawSeverity = formData.get("severity");
  const url = String(formData.get("url") ?? "").trim() || null;
  const sourceNotes = String(formData.get("sourceNotes") ?? "").trim() || null;
  const reportedAt = parseReportedAtDate(formData.get("reportedAt"));
  const assigneeIdRaw = String(formData.get("assigneeId") ?? "").trim() || null;

  if (!title || !description || !rawType || !rawPriority || !rawSeverity) {
    redirect("/tasks/new?error=missing-required-fields");
  }

  const type = parseIssueType(rawType);
  const priority = parsePriority(rawPriority);
  const severity = parseSeverity(rawSeverity);
  if (!type || !priority || !severity) {
    redirect("/tasks/new?error=invalid-enum");
  }

  let status: IssueStatus = "OPEN";
  if (session.user.role === "ADMIN") {
    const parsedStatus = parseEnumValue(formData.get("status"), [
      "OPEN",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
    ] as const);
    if (parsedStatus) {
      status = parsedStatus;
    }
  }

  const screenshotsParseResult = parseScreenshotMetadata(
    formData.get("screenshotsMeta"),
  );
  if (screenshotsParseResult.error) {
    redirect("/tasks/new?error=invalid-screenshots-meta");
  }

  const attachmentsParseResult = parseAttachmentMetadata(
    formData.get("attachmentsMeta"),
  );
  if (attachmentsParseResult.error) {
    redirect("/tasks/new?error=invalid-attachments-meta");
  }

  const screenshots = screenshotsParseResult.data ?? [];
  const attachments = attachmentsParseResult.data ?? [];

  let assigneeId: string | null = null;
  if (assigneeIdRaw) {
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeIdRaw },
      select: { id: true },
    });
    assigneeId = assignee?.id ?? null;
  }

  let issue;
  try {
    issue = await prisma.issue.create({
      data: {
        title,
        description,
        type,
        priority,
        severity,
        status,
        url,
        sourceNotes,
        reportedAt,
        assigneeId,
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
        attachments: {
          create: attachments.map((file, idx: number) => ({
            url: file.url,
            filename: file.filename,
            mimeType: file.mimeType,
            sizeBytes: file.sizeBytes,
            uploaderId: session.user.id,
            order: idx,
          })),
        },
      },
      include: { screenshots: true, attachments: true },
    });
  } catch (error) {
    console.error("Failed to create issue", error);
    redirect("/tasks/new?error=create-failed");
  }

  try {
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
          status: issue.status,
          assigneeId: issue.assigneeId,
          reportedAt: issue.reportedAt ? issue.reportedAt.toISOString() : null,
          sourceNotes: issue.sourceNotes,
          screenshotCount: issue.screenshots.length,
          attachmentCount: issue.attachments.length,
        },
      },
    });
  } catch (error) {
    console.error("Failed to write issue creation history", error);
  }

  redirect("/tasks");
}

export default async function NewIssuePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await getAppSession();
  if (!session?.user) {
    redirect("/login");
  }

  const ability = await defineAbilitiesForAsync(session.user);
  if (!ability.can("create", "Issue")) {
    redirect("/tasks");
  }

  const assignableUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  const params = await searchParams;
  const errorMessage =
    params?.error === "missing-required-fields"
      ? "All required fields must be filled."
      : params?.error === "invalid-enum"
        ? "Invalid issue type, priority, or severity."
        : params?.error === "invalid-screenshots-meta"
          ? "Invalid screenshot metadata. Please retry upload."
          : params?.error === "invalid-attachments-meta"
            ? "Invalid attachment metadata. Please retry upload."
            : params?.error === "create-failed"
              ? "Unable to create issue right now. Please try again."
            : "";

  return (
    <div className="page-stack">
      <PageHeader
        title="Create issue"
        description="Capture bugs, requests, or blockers with the details needed to move work forward."
      />
      <Card className="border-0 bg-transparent shadow-none">
        <NewIssueForm
          action={createIssue}
          errorMessage={errorMessage}
          isAdmin={session.user.role === "ADMIN"}
          loggedByLabel={session.user.name || session.user.email}
          assignees={assignableUsers.map((u) => ({
            id: u.id,
            label: u.name || u.email,
          }))}
        />
      </Card>
    </div>
  );
}
