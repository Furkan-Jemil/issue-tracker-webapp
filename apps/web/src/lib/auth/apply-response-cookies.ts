import { parseSetCookieHeader } from "better-auth/cookies";
import { cookies } from "next/headers";

type SameSiteOpt = "lax" | "strict" | "none" | undefined;

function normalizeSameSite(v: unknown): SameSiteOpt {
  if (typeof v !== "string") return undefined;
  const s = v.toLowerCase();
  if (s === "strict" || s === "lax" || s === "none") return s;
  return undefined;
}

/**
 * Copies Set-Cookie headers from a Better Auth fetch Response into Next.js cookies().
 * Needed for server actions: redirect() does not carry Response headers, and
 * Headers#get("set-cookie") drops cookies when multiple are set (use getSetCookie).
 */
export async function applyAuthResponseCookies(response: Response): Promise<void> {
  const cookieStore = await cookies();
  const h = response.headers;

  const withGetSetCookie = h as Headers & { getSetCookie?: () => string[] };
  const rawCookies: string[] =
    typeof withGetSetCookie.getSetCookie === "function"
      ? withGetSetCookie.getSetCookie()
      : (() => {
          const single = h.get("set-cookie");
          return single ? [single] : [];
        })();

  for (const setCookiePart of rawCookies) {
    const parsed = parseSetCookieHeader(setCookiePart);
    parsed.forEach((meta, name) => {
      if (!name) return;
      try {
        const opts: Parameters<typeof cookieStore.set>[2] = {
          httpOnly: meta.httponly === true,
          secure: meta.secure === true,
          sameSite: normalizeSameSite(meta.samesite),
          path: typeof meta.path === "string" ? meta.path : "/",
        };
        if (typeof meta["max-age"] === "number" && !Number.isNaN(meta["max-age"])) {
          opts.maxAge = meta["max-age"];
        }
        if (meta.expires instanceof Date) {
          opts.expires = meta.expires;
        }
        if (typeof meta.domain === "string" && meta.domain.length > 0) {
          opts.domain = meta.domain;
        }
        cookieStore.set(name, meta.value, opts);
      } catch {
        // Omit domain or other attrs if Next.js rejects (e.g. localhost).
        try {
          cookieStore.set(name, meta.value, {
            httpOnly: meta.httponly === true,
            secure: meta.secure === true,
            sameSite: normalizeSameSite(meta.samesite),
            path: typeof meta.path === "string" ? meta.path : "/",
            ...(typeof meta["max-age"] === "number" && !Number.isNaN(meta["max-age"])
              ? { maxAge: meta["max-age"] }
              : {}),
          });
        } catch {
          /* ignore */
        }
      }
    });
  }
}
