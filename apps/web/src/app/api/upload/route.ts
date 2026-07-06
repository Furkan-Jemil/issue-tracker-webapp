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
  detectMimeFromMagic,
  MIME_EXTENSION,
  extFromName,
  extFromMime,
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
      keyPrefix: "upload:post",
      identifier: session.user.id,
      max: 10,
      windowMs: 60_000,
    });
    if (rateLimited) {
      return rateLimited;
    }

    const formData = await req.formData();
    const files = formData.getAll("screenshots");
    const attachmentFiles = formData.getAll("attachments");

    if (files.length > MAX_FILE_COUNT) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILE_COUNT} files allowed` },
        { status: 400 },
      );
    }
    if (attachmentFiles.length > MAX_ATTACHMENT_FILE_COUNT) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ATTACHMENT_FILE_COUNT} attachments allowed` },
        { status: 400 },
      );
    }

    const savedFiles: {
      url: string;
      filename: string;
      mimeType: string;
      sizeBytes: number;
    }[] = [];
    const rejectedFiles: {
      filename: string;
      reason: string;
    }[] = [];
    const savedAttachments: {
      url: string;
      filename: string;
      mimeType: string;
      sizeBytes: number;
    }[] = [];
    const rejectedAttachments: {
      filename: string;
      reason: string;
    }[] = [];

    for (const rawFile of files) {
      if (!(rawFile instanceof File)) {
        rejectedFiles.push({
          filename: "unknown",
          reason: "Invalid file payload",
        });
        continue;
      }

      const originalName = rawFile.name || "unnamed";

      if (!rawFile.name || rawFile.name.length > 255) {
        rejectedFiles.push({
          filename: originalName,
          reason: "Invalid filename",
        });
        continue;
      }

      if (!rawFile.type) {
        rejectedFiles.push({
          filename: originalName,
          reason: "Missing MIME type",
        });
        continue;
      }

      if (!isAllowedMimeType(rawFile.type)) {
        rejectedFiles.push({
          filename: originalName,
          reason: "Unsupported file type",
        });
        continue;
      }

      if (rawFile.size > MAX_FILE_SIZE) {
        rejectedFiles.push({
          filename: originalName,
          reason: `File exceeds ${MAX_FILE_SIZE} bytes`,
        });
        continue;
      }

      const buffer = Buffer.from(await rawFile.arrayBuffer());
      const detectedType = detectMimeFromMagic(buffer, rawFile.type);
      if (!detectedType || detectedType !== rawFile.type) {
        rejectedFiles.push({
          filename: originalName,
          reason: "File content does not match declared type",
        });
        continue;
      }

      const ext = MIME_EXTENSION[detectedType];
      const storedFilename = `${randomUUID()}.${ext}`;
      const { url } = await persistUploadedFile({
        buffer,
        mimeType: detectedType,
        storedFilename,
        kind: "screenshot",
      });

      savedFiles.push({
        url,
        filename: originalName,
        mimeType: detectedType,
        sizeBytes: rawFile.size,
      });
    }

    for (const rawFile of attachmentFiles) {
      if (!(rawFile instanceof File)) {
        rejectedAttachments.push({
          filename: "unknown",
          reason: "Invalid file payload",
        });
        continue;
      }

      const originalName = rawFile.name || "unnamed";
      if (!rawFile.name || rawFile.name.length > 255) {
        rejectedAttachments.push({
          filename: originalName,
          reason: "Invalid filename",
        });
        continue;
      }
      if (!rawFile.type || !isAllowedAttachmentMimeType(rawFile.type)) {
        rejectedAttachments.push({
          filename: originalName,
          reason: "Unsupported file type",
        });
        continue;
      }
      if (rawFile.size > MAX_ATTACHMENT_FILE_SIZE) {
        rejectedAttachments.push({
          filename: originalName,
          reason: `File exceeds ${MAX_ATTACHMENT_FILE_SIZE} bytes`,
        });
        continue;
      }

      const sourceExt = extFromName(originalName);
      const ext = sourceExt || extFromMime(rawFile.type);
      const storedFilename = `${randomUUID()}-${sanitizeFilename(originalName)}.${ext}`;
      const buffer = Buffer.from(await rawFile.arrayBuffer());
      const detectedType = detectMimeFromMagic(buffer, rawFile.type);
      if (!detectedType || detectedType !== rawFile.type) {
        rejectedAttachments.push({
          filename: originalName,
          reason: "File content does not match declared type",
        });
        continue;
      }
      
      const { url } = await persistUploadedFile({
        buffer,
        mimeType: rawFile.type,
        storedFilename,
        kind: "attachment",
      });

      savedAttachments.push({
        url,
        filename: originalName,
        mimeType: rawFile.type,
        sizeBytes: rawFile.size,
      });
    }

    if (
      savedFiles.length === 0 &&
      files.length > 0 &&
      savedAttachments.length === 0 &&
      attachmentFiles.length === 0
    ) {
      return NextResponse.json(
        {
          error: "No valid files uploaded",
          rejected: rejectedFiles,
        },
        { status: 400 },
      );
    }

    if (
      savedAttachments.length === 0 &&
      attachmentFiles.length > 0 &&
      savedFiles.length === 0 &&
      files.length === 0
    ) {
      return NextResponse.json(
        {
          error: "No valid attachments uploaded",
          attachmentsRejected: rejectedAttachments,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      files: savedFiles,
      rejected: rejectedFiles,
      attachments: savedAttachments,
      attachmentsRejected: rejectedAttachments,
    });
  } catch (error) {
    console.error("Screenshot upload failed", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
