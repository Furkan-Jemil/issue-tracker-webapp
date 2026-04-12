import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
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
import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { PendingSubmitButton } from "@/components/auth/PendingSubmitButton";
import { getPostLoginPath } from "@/lib/auth/post-login-redirect";
import { getAppSession } from "@/lib/auth/session";

async function registerUser(formData: FormData) {
  "use server";
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  if (!name || !email || !password || !role) {
    redirect("/register?error=missing-fields");
  }

  if (password.length < 8) {
    redirect("/register?error=password-too-short");
  }

  const normalizedRole = role.toUpperCase();
  if (normalizedRole !== "USER" && normalizedRole !== "TESTER") {
    redirect("/register?error=invalid-role");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });
  if (existing) {
    redirect("/register?error=email-exists");
  }

  try {
    const res = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    if (!res?.user?.id) {
      redirect("/register?error=register-failed");
    }

    await prisma.user.update({
      where: { id: res.user.id },
      data: { role: normalizedRole as Role },
    });
  } catch {
    redirect("/register?error=register-failed");
  }

  redirect("/login?registered=1");
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await getAppSession();
  if (session?.user) {
    redirect(getPostLoginPath(session.user.role));
  }

  const params = await searchParams;

  const errorMessage =
    params?.error === "missing-fields"
      ? "All fields are required."
      : params?.error === "email-exists"
        ? "Email already registered."
        : params?.error === "invalid-role"
          ? "Invalid role selection."
          : params?.error === "password-too-short"
            ? "Password must be at least 8 characters."
            : params?.error === "register-failed"
              ? "Registration failed. Please try again."
              : "";

  return (
    <AuthShell>
      <Card className="w-full max-w-md border-border/80 shadow-lg shadow-black/5">
        <CardHeader className="space-y-1.5 border-b border-border/60 bg-muted/20">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserPlus className="h-5 w-5" aria-hidden />
          </div>
          <CardTitle className="text-xl font-semibold tracking-tight md:text-2xl">
            Create account
          </CardTitle>
          <CardDescription className="text-sm md:text-base">
            Join to report issues and collaborate with your team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={registerUser} className="space-y-4">
            {errorMessage && (
              <div
                id="register-error"
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
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
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Password (min 8 characters)"
                autoComplete="new-password"
                minLength={8}
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
            <PendingSubmitButton className="w-full" pendingLabel="Creating account…">
              Register
            </PendingSubmitButton>
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
    </AuthShell>
  );
}
