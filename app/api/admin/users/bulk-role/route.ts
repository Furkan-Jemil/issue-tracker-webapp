import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { ids, role } = await req.json();
  if (
    !Array.isArray(ids) ||
    !role ||
    !["USER", "TESTER", "ADMIN"].includes(role)
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  await prisma.user.updateMany({ where: { id: { in: ids } }, data: { role } });
  return NextResponse.json({ success: true });
}
