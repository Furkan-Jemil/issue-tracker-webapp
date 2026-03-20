import { Button } from "@/components/ui/button";
import { PrismaClient, Role } from "@prisma/client";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function registerUser(formData: FormData) {
  "use server";
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  if (!name || !email || !password || !role) {
    redirect("/register?error=missing-fields");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/register?error=email-exists");
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email, password: hashed, role: role as Role },
  });
  redirect("/login");
}

export default function RegisterPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const errorMessage =
    searchParams?.error === "missing-fields"
      ? "All fields are required."
      : searchParams?.error === "email-exists"
        ? "Email already registered."
        : "";

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        action={registerUser}
        method="post"
        className="space-y-4 bg-white p-8 rounded shadow w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4">Register</h1>
        {errorMessage && (
          <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        <input
          name="name"
          type="text"
          placeholder="Full Name"
          required
          className="w-full border p-2 rounded"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full border p-2 rounded"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full border p-2 rounded"
        />
        <select name="role" required className="w-full border p-2 rounded">
          <option value="USER">User</option>
          <option value="TESTER">Tester</option>
        </select>
        <Button type="submit" className="w-full">
          Register
        </Button>
      </form>
    </div>
  );
}
