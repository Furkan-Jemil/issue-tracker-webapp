import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const session = await auth.getSession(req);
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/issues/:path*", "/admin/:path*"],
};
