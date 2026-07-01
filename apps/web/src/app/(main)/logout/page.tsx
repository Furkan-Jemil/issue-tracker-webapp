import { PendingSubmitButton } from "@/app/(auth)/components/pending-submit-button";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME } from "@/lib/auth/mock-session";

async function signOut() {
  "use server";

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  redirect("/login");
}

export default function LogoutPage() {
  return (
    <div className="page-stack mx-auto w-full max-w-md px-4 py-8 md:py-14">
      <PageHeader
        title="Sign out"
        description="End your current session and return to the login screen."
      />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Confirm sign out</CardTitle>
          <CardDescription>
            You will be returned to the login page after signing out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOut} className="space-y-4">
            <PendingSubmitButton className="w-full" pendingLabel="Signing out…">
              Sign out
            </PendingSubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
