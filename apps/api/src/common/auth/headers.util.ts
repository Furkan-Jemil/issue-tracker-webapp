/**
 * Converts Node/Express request headers (a plain object with string | string[]
 * values) into a Web `Headers` instance, which our verbatim `getServerSession`
 * and `auth.api.getSession` both expect (`headers.get(...)`).
 */
export function toWebHeaders(
  nodeHeaders: Record<string, string | string[] | undefined>,
): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else if (value != null) {
      headers.set(key, String(value));
    }
  }
  return headers;
}
