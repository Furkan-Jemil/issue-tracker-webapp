import { PrismaClient, Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export default async function EditUserPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return <div className="p-8">Admin access required.</div>;
  }
  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return <div className="p-8">User not found.</div>;
  const userId = user.id;

  async function updateRole(formData: FormData) {
    "use server";
    const newRole = formData.get("role") as Role;
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
    redirect("/admin/users");
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Edit User</h1>
      <form action={updateRole} className="space-y-4">
        <div>
          <label className="block mb-1 font-semibold">Name</label>
          <div className="p-2 border rounded bg-gray-100">{user.name}</div>
        </div>
        <div>
          <label className="block mb-1 font-semibold">Email</label>
          <div className="p-2 border rounded bg-gray-100">{user.email}</div>
        </div>
        <div>
          <label className="block mb-1 font-semibold">Role</label>
          <select
            name="role"
            defaultValue={user.role}
            className="border rounded px-2 py-1">
            <option value="USER">User</option>
            <option value="TESTER">Tester</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Update Role
        </button>
      </form>
    </div>
  );
}
