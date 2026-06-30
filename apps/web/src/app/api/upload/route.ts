import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { getAppSession } from "@/lib/auth/session";
import { applyRateLimit } from "@/lib/rateLimit";
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  ALLOWED_SCREENSHOT_MIME_TYPES,
  MAX_ATTACHMENT_COUNT,
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_SCREENSHOT_COUNT,
  MAX_SCREENSHOT_SIZE_BYTES,
} from "@/lib/issueValidation";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = MAX_SCREENSHOT_SIZE_BYTES;
const MAX_FILE_COUNT = MAX_SCREENSHOT_COUNT;
const ALLOWED_TYPES = [...ALLOWED_SCREENSHOT_MIME_TYPES];
const MAX_ATTACHMENT_FILE_SIZE = MAX_ATTACHMENT_SIZE_BYTES;
const MAX_ATTACHMENT_FILE_COUNT = MAX_ATTACHMENT_COUNT;
type AllowedMimeType = (typeof ALLOWED_SCREENSHOT_MIME_TYPES)[number];
type AllowedAttachmentMimeType = (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number];
const MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};
const IS_VERCEL = Boolean(process.env.VERCEL);
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const USE_BLOB_STORAGE = IS_VERCEL && Boolean(BLOB_TOKEN);

function detectMimeFromMagic(buffer: Buffer, claimedMime: string): string | null {
  // JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }

  // GIF: GIF87a or GIF89a
  if (buffer.length >= 6 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return "image/gif";
  }

  // WebP: RIFF....WEBP
  if (buffer.length >= 12 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return "image/webp";
  }

  // PDF: %PDF
  if (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return "application/pdf";
  }

  // ZIP / DOCX / XLSX (PK ZIP format)
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
    // DOCX/XLSX/ZIP all share the same magic bytes. We trust the claimed MIME if it's one of them.
    if (claimedMime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        claimedMime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        claimedMime === "application/zip") {
      return claimedMime;
    }
    return "application/zip";
  }

  // OLE2 / DOC / XLS
  if (buffer.length >= 8 && buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0 && buffer[4] === 0xa1 && buffer[5] === 0xb1 && buffer[6] === 0x1a && buffer[7] === 0xe1) {
    if (claimedMime === "application/msword" || claimedMime === "application/vnd.ms-excel") {
      return claimedMime;
    }
    return "application/msword";
  }

  // Text-based files (no reliable magic bytes, we rely on claimed MIME and validate it's in allowed list later)
  if (claimedMime === "text/plain" || claimedMime === "text/csv" || claimedMime === "application/json") {
    return claimedMime;
  }

  return null;
}

function isAllowedMimeType(value: string): value is AllowedMimeType {
  return ALLOWED_TYPES.includes(value as AllowedMimeType);
}

function isAllowedAttachmentMimeType(
  value: string,
): value is AllowedAttachmentMimeType {
  return ALLOWED_ATTACHMENT_MIME_TYPES.includes(
    value as AllowedAttachmentMimeType,
  );
}

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned.slice(0, 120) || "file";
}

function extFromName(name: string): string | null {
  const idx = name.lastIndexOf(".");
  if (idx <= 0 || idx === name.length - 1) return null;
  return name.slice(idx + 1).toLowerCase();
}

function extFromMime(mime: string): string {
  if (mime === "application/pdf") return "pdf";
  if (mime === "text/plain") return "txt";
  if (mime === "text/csv") return "csv";
  if (mime === "application/zip") return "zip";
  if (mime === "application/json") return "json";
  if (mime === "application/msword") return "doc";
  if (
    mime ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "docx";
  if (mime === "application/vnd.ms-excel") return "xls";
  if (
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    return "xlsx";
  return "bin";
}

function toDataUrl(mimeType: string, buffer: Buffer): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function persistUploadedFile(options: {
  buffer: Buffer;
  mimeType: string;
  storedFilename: string;
  kind: "screenshot" | "attachment";
}): Promise<{ url: string }> {
  const { buffer, mimeType, storedFilename, kind } = options;

  if (USE_BLOB_STORAGE) {
    try {
      const blob = await put(`uploads/${storedFilename}`, buffer, {
        access: "public",
        token: BLOB_TOKEN,
        contentType: mimeType,
        addRandomSuffix: false,
      });
      return { url: blob.url };
    } catch (error) {
      console.error(
        `${kind} blob upload failed, falling back to data URL`,
        error,
      );
    }
  }

  if (!IS_VERCEL) {
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      const filepath = path.join(UPLOAD_DIR, storedFilename);
      await fs.writeFile(filepath, buffer);
      return { url: `/uploads/${storedFilename}` };
    } catch (error) {
      console.error(
        `${kind} disk upload failed, falling back to data URL`,
        error,
      );
    }
  }

  return { url: toDataUrl(mimeType, buffer) };
}

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
