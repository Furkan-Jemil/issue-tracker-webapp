import { Context } from 'hono'

function getAllowedOrigins(): string[] {
  const origins = new Set<string>([
    'http://localhost:3000',
  ])

  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',')
      .map(o => o.trim())
      .filter(Boolean)
      .forEach(o => origins.add(o))
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.add(process.env.NEXT_PUBLIC_APP_URL.trim())
  }

  return Array.from(origins)
}

export function corsMiddleware(allowedOrigins?: string[]) {
  const finalOrigins = allowedOrigins ?? getAllowedOrigins()

  return async (c: Context, next: () => Promise<void>) => {
    const origin = c.req.header('origin')
    const respHeaders: Record<string, string> = {}
    if (origin && finalOrigins.includes(origin)) {
      respHeaders['Access-Control-Allow-Origin'] = origin
      respHeaders['Access-Control-Allow-Credentials'] = 'true'
      respHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
      respHeaders['Access-Control-Allow-Methods'] = 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
      respHeaders['Vary'] = 'Origin'

      // Apply headers to ongoing context so downstream handlers also see them
      Object.entries(respHeaders).forEach(([k, v]) => c.header(k, v))
    }

    if (c.req.method === 'OPTIONS') {
      return new Response('ok', { status: 204, headers: respHeaders })
    }
    await next()
  }
}
