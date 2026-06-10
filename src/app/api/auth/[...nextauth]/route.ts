import { auth } from "@/lib/auth";
import { applyRateLimit } from "@/lib/rateLimit";
import { toNextJsHandler } from "better-auth/next-js";

const { GET: authGet, POST: authPost } = toNextJsHandler(auth);

export async function GET(req: Request) {
  const rateLimited = applyRateLimit(req, {
    keyPrefix: "auth:get",
    max: 180,
    windowMs: 60_000,
  });
  if (rateLimited) {
    return rateLimited;
  }

  return authGet(req);
}

export async function POST(req: Request) {
  const rateLimited = applyRateLimit(req, {
    keyPrefix: "auth:post",
    max: 30,
    windowMs: 60_000,
  });
  if (rateLimited) {
    return rateLimited;
  }

  return authPost(req);
}
