import { getPostLoginPath } from "@/lib/auth/post-login-redirect";
import { getAppSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getAppSession();

  if (!session?.user) {
    redirect("/login");
  }

  redirect(getPostLoginPath(session.user.role));
}
