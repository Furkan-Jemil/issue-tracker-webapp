import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("screenshots");
  const savedFiles: {
    url: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
  }[] = [];

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  for (const file of files) {
    if (typeof file === "object" && "arrayBuffer" in file) {
      if (
        !ALLOWED_TYPES.includes((file as any).type) ||
        (file as any).size > MAX_FILE_SIZE
      ) {
        continue;
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = (file as any).name.split(".").pop();
      const filename = `${randomUUID()}.${ext}`;
      const filepath = path.join(UPLOAD_DIR, filename);
      await fs.writeFile(filepath, buffer);
      savedFiles.push({
        url: `/uploads/${filename}`,
        filename: (file as any).name,
        mimeType: (file as any).type,
        sizeBytes: (file as any).size,
      });
    }
  }

  return NextResponse.json({ files: savedFiles });
}
