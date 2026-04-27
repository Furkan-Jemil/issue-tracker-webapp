import { type NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/issues/:path*", "/admin/:path*"],
};
