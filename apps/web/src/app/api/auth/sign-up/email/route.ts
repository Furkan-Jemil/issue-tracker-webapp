import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/auth/sign-up/email
// Used by the mobile app to register a new account.
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: any = {};
    if (contentType.includes("application/json")) {
      body = await request.json().catch(() => ({}));
    } else {
      const fd = await request.formData().catch(() => new FormData());
      body = Object.fromEntries(fd);
    }

    const res = await (auth as any).api.signUpEmail({ body });
    // If better-auth returned a plain object-like response, coerce to Response
    if (res && typeof res === "object" && "status" in res && "body" in res) {
      const headers = res.headers || { "content-type": "application/json" };
      const bodyStr =
        typeof res.body === "string" ? res.body : JSON.stringify(res.body);
      return new Response(bodyStr, { status: res.status, headers });
    }
    return NextResponse.json(res);
  } catch (err) {
    console.error("POST /api/auth/sign-up/email error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
