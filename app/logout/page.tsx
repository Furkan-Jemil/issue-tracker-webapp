import { PendingSubmitButton } from "@/components/auth/PendingSubmitButton";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { applyAuthResponseCookies } from "@/lib/auth/apply-response-cookies";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function signOut() {
  "use server";

  const response = await auth.api.signOut({
    headers: await headers(),
    asResponse: true,
  });

  await applyAuthResponseCookies(response);
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
