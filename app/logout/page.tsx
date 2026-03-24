import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function signOut() {
  "use server";

  const response = await auth.api.signOut({
    headers: await headers(),
    asResponse: true,
  });

  if (!response.ok) {
    redirect("/login");
  }

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
            <Button type="submit" className="w-full">
              Sign Out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
