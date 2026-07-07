export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { defineAbilitiesFor, CreateIssueSchema } from "@workspace/shared";

// Helper to authenticate request using Bearer token
async function getAuthUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  const session = await prisma.session.findFirst({
    where: { token },
    include: { user: true },
  });

  if (!session || new Date() > new Date(session.expiresAt)) {
    return null;
  }

  return session.user;
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ability = defineAbilitiesFor({ id: user.id, role: user.role as any });
    if (!ability.can("read", "Issue")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Retrieve all issues ordered by newest first with full relations
    const issues = await prisma.issue.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { name: true, email: true } },
        assignee: { select: { name: true, email: true } },
        screenshots: { orderBy: { createdAt: "desc" } },
        attachments: {
          orderBy: { createdAt: "desc" },
          include: { uploader: { select: { name: true, email: true } } },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json(issues);
  } catch (err: any) {
    console.error("GET /api/issues-mobile error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ability = defineAbilitiesFor({ id: user.id, role: user.role as any });
    if (!ability.can("create", "Issue")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = CreateIssueSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const rawScreenshots = Array.isArray(body.screenshots) ? body.screenshots : [];
    const rawAttachments = Array.isArray(body.attachments) ? body.attachments : [];

    const issue = await prisma.issue.create({
      data: {
        title: result.data.title,
        description: result.data.description,
        type: result.data.type as any,
        priority: result.data.priority as any,
        severity: result.data.severity as any,
        createdBy: user.id,
        screenshots: {
          create: rawScreenshots
            .filter((f: any) => Boolean(f?.url))
            .map((f: any, idx: number) => ({
              url: String(f.url),
              filename: String(f.filename || "screenshot.png"),
              mimeType: String(f.mimeType || "image/png"),
              sizeBytes: Number(f.sizeBytes || 0),
              order: idx,
            })),
        },
        attachments: {
          create: rawAttachments
            .filter((f: any) => Boolean(f?.url))
            .map((f: any, idx: number) => ({
              url: String(f.url),
              filename: String(f.filename || "attachment.pdf"),
              mimeType: String(f.mimeType || "application/octet-stream"),
              sizeBytes: Number(f.sizeBytes || 0),
              uploaderId: user.id,
              order: idx,
            })),
        },
      },
      include: {
        creator: { select: { name: true, email: true } },
        assignee: { select: { name: true, email: true } },
        screenshots: { orderBy: { createdAt: "desc" } },
        attachments: {
          orderBy: { createdAt: "desc" },
          include: { uploader: { select: { name: true, email: true } } },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json(issue, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/issues-mobile error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
