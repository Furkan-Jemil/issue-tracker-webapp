import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default function LogoutPage() {
  async function handleLogout() {
    "use server";
    await auth.signOut();
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        action={handleLogout}
        method="post"
        className="space-y-4 bg-white p-8 rounded shadow w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4">Sign Out</h1>
        <Button type="submit" className="w-full">
          Sign Out
        </Button>
      </form>
    </div>
  );
}
