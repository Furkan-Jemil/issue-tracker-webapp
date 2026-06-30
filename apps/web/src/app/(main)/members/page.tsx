import prisma from "@/lib/prisma";
import { getAppSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { MembersClient } from "./members-client";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { Role } from "@prisma/client";
import { parseEnumValue } from "@/lib/issueValidation";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{
    search?: string;
    role?: string;
    page?: string;
  }>;
}) {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return (
      <div className="rounded-xl border border-border/70 bg-card/80 p-4 text-sm">
        You are not authorized to view this page.
      </div>
    );
  }

  const params = await searchParams;
  const search = (params?.search || "").trim();
  const roleFilter = parseEnumValue(params?.role || null, Object.values(Role));
  const page = Math.max(1, Number(params?.page || "1") || 1);
  const pageSize = DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, total, totalRecords] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
    prisma.user.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="page-stack">
      <PageHeader
        title="Members"
        description="Manage user accounts, access roles, and operational permissions."
      />
      <MembersClient
        initialUsers={users}
        total={total}
        totalRecords={totalRecords}
        page={page}
        totalPages={totalPages}
        search={search}
        roleFilter={roleFilter || ""}
      />
    </div>
  );
}
