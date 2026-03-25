import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { randomBytes, scryptSync } from "node:crypto";

function hashForBetterAuth(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${key.toString("hex")}`;
}

async function registerUser(formData: FormData) {
  "use server";
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  if (!name || !email || !password || !role) {
    redirect("/register?error=missing-fields");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRole = String(role).toUpperCase();

  if (normalizedRole !== "USER" && normalizedRole !== "TESTER") {
    redirect("/register?error=invalid-role");
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    redirect("/register?error=email-exists");
  }

  const passwordHash = hashForBetterAuth(password);

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          role: normalizedRole as Role,
          password: passwordHash,
        },
      });

      await tx.account.create({
        data: {
          providerId: "credential",
          accountId: user.id,
          userId: user.id,
          password: passwordHash,
        },
      });
    });
  } catch {
    redirect("/register?error=register-failed");
  }

  redirect("/login?registered=1");
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; registered?: string }>;
}) {
  const params = await searchParams;

  const errorMessage =
    params?.error === "missing-fields"
      ? "All fields are required."
      : params?.error === "email-exists"
        ? "Email already registered."
        : params?.error === "invalid-role"
          ? "Invalid role selection."
        : params?.error === "register-failed"
          ? "Registration failed. Please try again."
          : "";

  return (
    <div className="mx-auto flex w-full max-w-md items-center justify-center px-4 py-8 md:py-14">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>
            Create an account to report and track issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={registerUser} className="space-y-4">
            {errorMessage && (
              <div
                id="register-error"
                role="alert"
                className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Full Name"
                autoComplete="name"
                aria-describedby={errorMessage ? "register-error" : undefined}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                autoComplete="email"
                aria-describedby={errorMessage ? "register-error" : undefined}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                autoComplete="new-password"
                aria-describedby={errorMessage ? "register-error" : undefined}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Select id="role" name="role" required>
                <option value="USER">User</option>
                <option value="TESTER">Tester</option>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Register
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
