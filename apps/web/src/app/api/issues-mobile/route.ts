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

    // Retrieve all issues ordered by newest first
    const issues = await prisma.issue.findMany({
      orderBy: { createdAt: "desc" },
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

    const issue = await prisma.issue.create({
      data: {
        title: result.data.title,
        description: result.data.description,
        type: result.data.type as any,
        priority: result.data.priority as any,
        severity: result.data.severity as any,
        createdBy: user.id,
      },
    });

    return NextResponse.json(issue, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/issues-mobile error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
