import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { getAppSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { parseEnumValue } from "@/lib/issueValidation";
import { UserEditForm } from "../UserEditForm";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = await params;
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return <div className="rounded-xl border border-border/70 bg-card/80 p-4 text-sm">Admin access required.</div>;
  }
  const user = await prisma.user.findUnique({ where: { id: routeParams.id } });
  if (!user) return <div className="rounded-xl border border-border/70 bg-card/80 p-4 text-sm">User not found.</div>;
  const userId = user.id;

  async function updateRole(formData: FormData) {
    "use server";

    const actionSession = await getAppSession();
    if (!actionSession?.user || actionSession.user.role !== "ADMIN") {
      redirect("/login");
    }

    const parsedRole = parseEnumValue(
      formData.get("role"),
      Object.values(Role),
    );
    if (!parsedRole) {
      redirect(`/admin/users/${userId}`);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: parsedRole },
    });
    redirect("/admin/users");
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Edit User"
        description="Update the user role and account details."
        breadcrumbs={[
          { label: "Admin", href: "/admin/users" },
          { label: "Users", href: "/admin/users" },
          { label: user.email },
        ]}
      />
      <UserEditForm
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
        }}
        onSubmit={updateRole}
      />
    </div>
  );
}
