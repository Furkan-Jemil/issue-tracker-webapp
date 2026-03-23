import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILE_COUNT = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("screenshots");
    if (files.length > MAX_FILE_COUNT) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILE_COUNT} files allowed` },
        { status: 400 },
      );
    }

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

    if (savedFiles.length === 0 && files.length > 0) {
      return NextResponse.json(
        { error: "No valid files uploaded" },
        { status: 400 },
      );
    }

    return NextResponse.json({ files: savedFiles });
  } catch (error) {
    console.error("Screenshot upload failed", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
