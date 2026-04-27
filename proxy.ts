import { auth } from "@/lib/auth";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/issues/:path*", "/admin/:path*"],
};
