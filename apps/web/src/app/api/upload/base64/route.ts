export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAppSession } from "@/lib/auth/session";
import { applyRateLimit } from "@/lib/rateLimit";
import {
  MAX_FILE_COUNT,
  MAX_FILE_SIZE,
  MAX_ATTACHMENT_FILE_COUNT,
  MAX_ATTACHMENT_FILE_SIZE,
  isAllowedMimeType,
  isAllowedAttachmentMimeType,
  extFromName,
  sanitizeFilename,
  persistUploadedFile,
} from "@/lib/upload";

export async function POST(req: NextRequest) {
  try {
    const session = await getAppSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimited = applyRateLimit(req, {
      keyPrefix: "upload:base64",
      identifier: session.user.id,
      max: 10,
      windowMs: 60_000,
    });
    if (rateLimited) {
      return rateLimited;
    }

    const body = await req.json().catch(() => null);
    const files: { name?: string; type?: string; content?: string; sizeBytes?: number; kind?: string }[] = body?.files ?? [];

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const screenshots: { url: string; filename: string; mimeType: string; sizeBytes: number }[] = [];
    const attachments: { url: string; filename: string; mimeType: string; sizeBytes: number }[] = [];
    const rejected: { filename: string; reason: string }[] = [];
    const attachmentsRejected: { filename: string; reason: string }[] = [];

    for (const file of files) {
      const originalName = file.name || "unnamed";
      if (!file.content || typeof file.content !== "string") {
        rejected.push({ filename: originalName, reason: "Missing base64 content" });
        continue;
      }
      if (!file.type || typeof file.type !== "string") {
        rejected.push({ filename: originalName, reason: "Missing MIME type" });
        continue;
      }

      const isImage = file.type.startsWith("image/");
      const maxCount = isImage ? MAX_FILE_COUNT : MAX_ATTACHMENT_FILE_COUNT;
      const maxSize = isImage ? MAX_FILE_SIZE : MAX_ATTACHMENT_FILE_SIZE;
      const targetPool = isImage ? screenshots : attachments;
      const targetRejected = isImage ? rejected : attachmentsRejected;

      if (targetPool.length >= maxCount) {
        targetRejected.push({ filename: originalName, reason: `Maximum ${maxCount} files exceeded` });
        continue;
      }

      const sizeBytes = file.sizeBytes || Math.ceil(file.content.length * 0.75);
      if (sizeBytes > maxSize) {
        targetRejected.push({ filename: originalName, reason: `File exceeds ${maxSize} bytes` });
        continue;
      }

      if (isImage ? !isAllowedMimeType(file.type) : !isAllowedAttachmentMimeType(file.type)) {
        targetRejected.push({ filename: originalName, reason: "Unsupported file type" });
        continue;
      }

      const raw = file.content.replace(/^data:.+;base64,/, "");
      let buffer: Buffer;
      try {
        buffer = Buffer.from(raw, "base64");
      } catch {
        targetRejected.push({ filename: originalName, reason: "Invalid base64 data" });
        continue;
      }

      const ext = extFromName(originalName) || (isImage ? "png" : "bin");
      const storedFilename = `${randomUUID()}-${sanitizeFilename(originalName)}.${ext}`;
      const { url } = await persistUploadedFile({
        buffer,
        mimeType: file.type,
        storedFilename,
        kind: isImage ? "screenshot" : "attachment",
      });

      targetPool.push({ url, filename: originalName, mimeType: file.type, sizeBytes: buffer.length });
    }

    if (screenshots.length === 0 && attachments.length === 0 && files.length > 0) {
      return NextResponse.json({
        error: "No valid files uploaded",
        rejected,
        attachmentsRejected
      }, { status: 400 });
    }

    return NextResponse.json({ screenshots, attachments, rejected, attachmentsRejected });
  } catch (error) {
    console.error("Base64 upload handler failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
