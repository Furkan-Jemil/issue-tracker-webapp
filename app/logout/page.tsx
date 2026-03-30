import { PendingSubmitButton } from "@/components/auth/PendingSubmitButton";
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
    <div className="mx-auto flex w-full max-w-md items-center justify-center px-4 py-8 md:py-14">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign Out</CardTitle>
          <CardDescription>
            End your current session and return to login.
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
