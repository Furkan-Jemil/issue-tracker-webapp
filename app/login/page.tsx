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
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { PendingSubmitButton } from "@/components/auth/PendingSubmitButton";
import { applyAuthResponseCookies } from "@/lib/auth/apply-response-cookies";
import { getPostLoginPath } from "@/lib/auth/post-login-redirect";
import { getAppSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";

async function signInWithPassword(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/login?error=invalid-credentials");
  }

  let response: Response;
  try {
    response = await auth.api.signInEmail({
      body: {
        email,
        password,
        rememberMe: true,
      },
      headers: await headers(),
      asResponse: true,
    });
  } catch {
    redirect("/login?error=invalid-credentials");
  }

  if (!response.ok) {
    redirect("/login?error=invalid-credentials");
  }

  await applyAuthResponseCookies(response);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });
  if (!user) {
    redirect("/login?error=invalid-credentials");
  }
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
      <Card className="w-full max-w-md border-border/80 shadow-lg shadow-black/5">
        <CardHeader className="space-y-1">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LogIn className="h-5 w-5" aria-hidden />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Sign in
          </CardTitle>
          <CardDescription className="text-base">
            Continue with your workspace account.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                placeholder="Email"
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
                placeholder="Password"
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
