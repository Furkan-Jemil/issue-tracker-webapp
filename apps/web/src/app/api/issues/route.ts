/**
 * POST /api/issues
 *
 * Web-session-authenticated issue creation endpoint used by the quick-create
 * drawer (tasks-form-drawer.tsx).  The full-page /tasks/new route uses a
 * Server Action; the drawer cannot because it must stay open on validation
 * errors and avoid a full-page navigation.
 *
 * Auth:   getAppSession() — reads the `better-auth.session_token` cookie
 *         (same mechanism used by every other App Router route in this app).
 * Input:  multipart/form-data identical to the Server Action in new/page.tsx
 *         so both paths share the same validation helpers.
 * Output: { ok: true, issue: { id } }  on 201
 *         { error: string }             on 400 / 401 / 403 / 500
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth/session";
import { defineAbilitiesForAsync } from "@/lib/casl";
import prisma from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rateLimit";
import { createNotification } from "@/lib/notifications";
import {
  parseIssueType,
  parsePriority,
  parseSeverity,
  parseEnumValue,
  parseReportedAtDate,
  parseScreenshotMetadata,
  parseAttachmentMetadata,
} from "@/lib/issueValidation";
import type { IssueStatus } from "@prisma/client";

function formatRole(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export async function POST(req: NextRequest) {
  // ── 1. Auth ────────────────────────────────────────────────────────────
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Rate-limit (20 issue creations / minute per user) ──────────────
  const rateLimited = applyRateLimit(req, {
    keyPrefix: "issues:create",
    identifier: session.user.id,
    max: 20,
    windowMs: 60_000,
  });
  if (rateLimited) return rateLimited;

  // ── 3. CASL authorisation ─────────────────────────────────────────────
  const ability = await defineAbilitiesForAsync(session.user);
  if (!ability.can("create", "Issue")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 4. Parse FormData ─────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Could not parse request body" },
      { status: 400 },
    );
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawType = formData.get("type");
  const rawPriority = formData.get("priority");
  const rawSeverity = formData.get("severity");
  const url = String(formData.get("url") ?? "").trim() || null;
  const sourceNotes =
    String(formData.get("sourceNotes") ?? "").trim() || null;
  const assigneeIdRaw =
    String(formData.get("assigneeId") ?? "").trim() || null;
  const reportedAt = parseReportedAtDate(formData.get("reportedAt"));

  // ── 5. Required-field validation ──────────────────────────────────────
  if (!title || !description) {
    return NextResponse.json(
      { error: "Title and description are required." },
      { status: 400 },
    );
  }

  if (title.length > 255) {
    return NextResponse.json(
      { error: "Title must be 255 characters or fewer." },
      { status: 400 },
    );
  }

  const type = parseIssueType(rawType);
  const priority = parsePriority(rawPriority);
  const severity = parseSeverity(rawSeverity);

  if (!type || !priority || !severity) {
    return NextResponse.json(
      { error: "Invalid issue type, priority, or severity." },
      { status: 400 },
    );
  }

  // ── 6. Optional status (admin-only) ──────────────────────────────────
  let status: IssueStatus = "OPEN";
  if (session.user.role === "ADMIN") {
    const parsedStatus = parseEnumValue(formData.get("status"), [
      "OPEN",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
    ] as const);
    if (parsedStatus) status = parsedStatus;
  }

  // ── 7. Evidence metadata ──────────────────────────────────────────────
  const screenshotsResult = parseScreenshotMetadata(
    formData.get("screenshotsMeta"),
  );
  if (screenshotsResult.error) {
    return NextResponse.json(
      { error: `Invalid screenshot metadata: ${screenshotsResult.error}` },
      { status: 400 },
    );
  }

  const attachmentsResult = parseAttachmentMetadata(
    formData.get("attachmentsMeta"),
  );
  if (attachmentsResult.error) {
    return NextResponse.json(
      { error: `Invalid attachment metadata: ${attachmentsResult.error}` },
      { status: 400 },
    );
  }

  const screenshots = screenshotsResult.data ?? [];
  const attachments = attachmentsResult.data ?? [];

  // ── 8. Resolve assignee ───────────────────────────────────────────────
  let assigneeId: string | null = null;
  if (assigneeIdRaw) {
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeIdRaw },
      select: { id: true },
    });
    assigneeId = assignee?.id ?? null;
  }

  // ── 9. Create issue + audit log in a transaction ──────────────────────
  let issue: { id: string; title: string; assigneeId: string | null };
  try {
    const created = await prisma.$transaction(async (tx) => {
      const newIssue = await tx.issue.create({
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
            create: screenshots.map((f, idx) => ({
              url: f.url,
              filename: f.filename,
              mimeType: f.mimeType,
              sizeBytes: f.sizeBytes,
              order: idx,
            })),
          },
          attachments: {
            create: attachments.map((f, idx) => ({
              url: f.url,
              filename: f.filename,
              mimeType: f.mimeType,
              sizeBytes: f.sizeBytes,
              uploaderId: session.user.id,
              order: idx,
            })),
          },
        },
        select: {
          id: true,
          title: true,
          assigneeId: true,
          screenshots: { select: { id: true } },
          attachments: { select: { id: true } },
        },
      });

      await tx.issueHistory.create({
        data: {
          issueId: newIssue.id,
          actorId: session.user.id,
          eventType: "CREATED",
          description: `Issue created by ${session.user.name || "Unknown"} (${formatRole(session.user.role)})`,
          metadata: {
            title: newIssue.title,
            type,
            priority,
            severity,
            status,
            assigneeId,
            reportedAt: reportedAt ? reportedAt.toISOString() : null,
            sourceNotes,
            screenshotCount: newIssue.screenshots.length,
            attachmentCount: newIssue.attachments.length,
          },
        },
      });

      return newIssue;
    });

    issue = created;
  } catch (err) {
    console.error("[POST /api/issues] Failed to create issue", err);
    return NextResponse.json(
      { error: "Unable to create issue right now. Please try again." },
      { status: 500 },
    );
  }

  // ── 10. Notifications (fire-and-forget, never fatal) ──────────────────
  if (assigneeId && assigneeId !== session.user.id) {
    createNotification({
      userId: assigneeId,
      issueId: issue.id,
      message: `You were assigned to issue "${title}".`,
    }).catch((err) => {
      console.error("[POST /api/issues] Failed to send assignee notification", err);
    });
  }

  // ── 11. Respond ───────────────────────────────────────────────────────
  return NextResponse.json(
    { ok: true, issue: { id: issue.id } },
    { status: 201 },
  );
}
