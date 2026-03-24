import { auth } from "@/lib/auth";
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
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import bcrypt from "bcryptjs";
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

async function migrateLegacyBcryptHash(
  email: string,
  password: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return false;
  }

  const account = await prisma.account.findFirst({
    where: {
      providerId: "credential",
      userId: user.id,
    },
    select: {
      id: true,
      userId: true,
      password: true,
    },
  });

  if (!account?.password || !account.password.startsWith("$2")) {
    return false;
  }

  const matches = await bcrypt.compare(password, account.password);
  if (!matches) {
    return false;
  }

  const migratedHash = hashForBetterAuth(password);

  await prisma.$transaction([
    prisma.account.update({
      where: { id: account.id },
      data: { password: migratedHash },
    }),
    prisma.user.update({
      where: { id: account.userId },
      data: { password: migratedHash },
    }),
  ]);

  return true;
}

async function signInWithPassword(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/login?error=invalid-credentials");
  }

  try {
    let response = await auth.api.signInEmail({
      body: {
        email,
        password,
        rememberMe: true,
      },
      headers: await headers(),
      asResponse: true,
    });

    if (!response.ok) {
      redirect("/login?error=invalid-credentials");
    }

    redirect("/issues");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Invalid password hash")) {
      const migrated = await migrateLegacyBcryptHash(email, password);
      if (migrated) {
        const retryResponse = await auth.api.signInEmail({
          body: {
            email,
            password,
            rememberMe: true,
          },
          headers: await headers(),
          asResponse: true,
        });

        if (retryResponse.ok) {
          redirect("/issues");
        }
      }
    }

    redirect("/login?error=invalid-credentials");
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage =
    params?.error === "invalid-credentials" ? "Invalid email or password." : "";

  return (
    <div className="mx-auto flex w-full max-w-md items-center justify-center px-4 py-8 md:py-14">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Continue to the issue tracker using your existing account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signInWithPassword} className="space-y-4">
            {errorMessage && (
              <div
                id="login-error"
                role="alert"
                className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
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
            <Button type="submit" className="w-full">
              Sign In
            </Button>
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
    </div>
  );
}
