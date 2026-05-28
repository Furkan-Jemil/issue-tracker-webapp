import { Context } from 'hono'

const buckets = new Map<string, { count: number; windowStart: number }>()

function bucketKey(prefix: string, id: string): string {
  return `${prefix}:${id}`
}

export function rateLimitMiddleware(prefix: string, max = 60, windowMs = 60_000) {
  return async (c: Context, next: () => Promise<void>) => {
    const forwarded = c.req.header('x-forwarded-for')
    const ip = (forwarded ? forwarded.split(',')[0]?.trim() : null) ?? c.req.header('x-real-ip') ?? 'unknown'
    const key = bucketKey(prefix, ip)
    const now = Date.now()
    const entry = buckets.get(key)

    if (!entry || now - entry.windowStart >= windowMs) {
      buckets.set(key, { count: 1, windowStart: now })
      await next()
      return
    }

    if (entry.count >= max) {
      c.header('Retry-After', String(Math.ceil(windowMs / 1000)))
      return c.json({ error: 'Too many requests' }, { status: 429 })
    }

    entry.count += 1
    await next()
  }
}

// Programmatic check for handlers. Returns null on success or a simple JSON Response when rate limited.
export function checkRateLimit(prefix: string, identifier: string | null, max = 60, windowMs = 60_000) {
  const id = identifier ?? 'unknown'
  const key = bucketKey(prefix, id)
  const now = Date.now()
  const entry = buckets.get(key)

  if (!entry || now - entry.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now })
    return null
  }

  if (entry.count >= max) {
    return { status: 429, body: { error: 'Too many requests' }, headers: { 'Retry-After': String(Math.ceil(windowMs / 1000)) } }
  }

  entry.count += 1
  return null
}
