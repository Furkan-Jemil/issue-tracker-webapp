import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
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
import { AuthShell } from "@/app/(auth)/components/auth-shell";
import { PendingSubmitButton } from "@/app/(auth)/components/pending-submit-button";
import { getPostLoginPath } from "@/lib/auth/post-login-redirect";
import { getAppSession } from "@/lib/auth/session";

async function signInWithPassword(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/login?error=invalid-credentials");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true, password: true },
  });

  let storedPassword: string | null = user?.password ?? null;
  if (!storedPassword && user?.id) {
    const acct = await prisma.account.findFirst({
      where: { userId: user.id, providerId: { in: ["credential", "email"] } },
      select: { password: true },
    });
    storedPassword = acct?.password ?? null;
  }

  if (!user || !storedPassword) {
    redirect("/login?error=invalid-credentials");
  }

  let passwordOk = false;
  if (storedPassword.startsWith("$2")) {
    passwordOk = await bcrypt.compare(password, storedPassword);
  } else {
    try {
      const ctx = await (auth as any).$context;
      passwordOk = await ctx.password.verify({
        password,
        hash: storedPassword,
      });
    } catch (err) {
      console.warn("scrypt password verify failed:", err);
      passwordOk = false;
    }
  }

  if (!passwordOk) {
    redirect("/login?error=invalid-credentials");
  }

  const sessionToken = randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { userId: user.id, token: sessionToken, expiresAt },
  });

  const cs = await cookies();
  cs.set("better-auth.session_token", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  redirect(getPostLoginPath(user.role));
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; registered?: string }>;
}) {
  const session = await getAppSession();
  if (session?.user) {
    redirect(getPostLoginPath(session.user.role));
  }

  const params = await searchParams;
  const errorMessage =
    params?.error === "invalid-credentials" ? "Invalid email or password." : "";
  const registered = params?.registered === "1";

  return (
    <AuthShell>
      <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-lg shadow-black/5 backdrop-blur-sm">
        <CardHeader className="space-y-1.5 border-b border-border/60 bg-muted/20">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LogIn className="h-5 w-5" aria-hidden />
          </div>
          <CardTitle className="text-xl font-semibold tracking-tight md:text-2xl">
            Sign in
          </CardTitle>
          <CardDescription className="text-sm md:text-base">
            Enter your email and password to access your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <form action={signInWithPassword} className="space-y-4">
            {registered && (
              <div
                role="status"
                className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm text-primary">
                Account created successfully. Please sign in.
              </div>
            )}
            {errorMessage && (
              <div
                id="login-error"
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                {errorMessage}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                aria-describedby={errorMessage ? "login-error" : undefined}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-describedby={errorMessage ? "login-error" : undefined}
                required
              />
            </div>
            <PendingSubmitButton className="w-full" pendingLabel="Signing in…">
              Sign in
            </PendingSubmitButton>
            <p className="text-center text-sm text-muted-foreground">
              New here?{" "}
              <Link
                href="/register"
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                Create an account
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
