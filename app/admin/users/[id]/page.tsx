import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { getAppSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { parseEnumValue } from "@/lib/issueValidation";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = await params;
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return <div className="p-8">Admin access required.</div>;
  }
  const user = await prisma.user.findUnique({ where: { id: routeParams.id } });
  if (!user) return <div className="p-8">User not found.</div>;
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
    <div className="w-full px-3 py-3 md:px-4 md:py-4">
      <Card>
        <CardHeader>
          <CardTitle>Edit User</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateRole} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="user-name">Name</Label>
              <Input id="user-name" value={user.name} readOnly />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-email">Email</Label>
              <Input id="user-email" value={user.email} readOnly />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Select id="role" name="role" defaultValue={user.role}>
                <option value="USER">User</option>
                <option value="TESTER">Tester</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </div>
            <Button type="submit">Update Role</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
