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
import { ArrowRight, LogIn, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/app/(auth)/components/auth-shell";
import { PendingSubmitButton } from "@/app/(auth)/components/pending-submit-button";
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
  } catch (err) {
    console.error("signInEmail error:", err);
    redirect("/login?error=invalid-credentials");
  }

  if (!response.ok) {
    console.error("signInEmail response not OK:", response.status, await response.text());
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
      <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-lg shadow-black/5 backdrop-blur-sm">
        <CardHeader className="space-y-1.5 border-b border-border/60 bg-muted/20">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LogIn className="h-5 w-5" aria-hidden />
          </div>
          <CardTitle className="text-xl font-semibold tracking-tight md:text-2xl">
            Sign in
          </CardTitle>
          <CardDescription className="text-sm md:text-base">
            Continue with your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            <p>
              Protected sign-in. Your credentials are verified securely before redirect.
            </p>
          </div>
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
