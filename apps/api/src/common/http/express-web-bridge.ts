import type { Request, Response } from 'express';
import { toWebHeaders } from '../auth/headers.util';

/**
 * Express ↔ Web (Fetch) bridge.
 *
 * The existing Hono auth/upload handlers operate on Web `Request`/`Response`.
 * To reuse them VERBATIM under NestJS/Express we:
 *   - build a Web `Request` from the Express `req` (method, absolute URL,
 *     headers, and the raw body Buffer captured by a scoped `express.raw`
 *     parser — see main.ts), then
 *   - write the handler's Web `Response` back onto the Express `res`, taking
 *     special care to preserve MULTIPLE `Set-Cookie` headers (a plain
 *     `headers.forEach` coalesces them into one comma-joined value, which
 *     corrupts cookies — we use `getSetCookie()` instead).
 */

export function expressToWebRequest(req: Request): globalThis.Request {
  const protocol = req.protocol || 'http';
  const host = req.get('host') ?? 'localhost';
  const url = `${protocol}://${host}${req.originalUrl}`;
  const method = req.method.toUpperCase();
  const headers = toWebHeaders(req.headers);

  const hasBody = method !== 'GET' && method !== 'HEAD';
  // `express.raw` sets req.body to a Buffer on the scoped paths. If nothing was
  // captured (e.g. empty body), fall back to undefined.
  const rawBody: Buffer | undefined =
    hasBody && Buffer.isBuffer(req.body) && req.body.length > 0
      ? (req.body as Buffer)
      : undefined;

  return new Request(url, {
    method,
    headers,
    body: rawBody,
  });
}

export async function writeWebResponseToExpress(
  webRes: globalThis.Response,
  res: Response,
): Promise<void> {
  res.status(webRes.status);

  // Copy all headers EXCEPT set-cookie via forEach.
  webRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') return;
    res.setHeader(key, value);
  });

  // Preserve each Set-Cookie separately (getSetCookie is available on Node 20+).
  const anyHeaders = webRes.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookies =
    typeof anyHeaders.getSetCookie === 'function'
      ? anyHeaders.getSetCookie()
      : (() => {
          const single = webRes.headers.get('set-cookie');
          return single ? [single] : [];
        })();
  if (setCookies.length > 0) {
    res.setHeader('set-cookie', setCookies);
  }

  const arrayBuffer = await webRes.arrayBuffer();
  res.end(Buffer.from(arrayBuffer));
}
