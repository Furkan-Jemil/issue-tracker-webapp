import { Context } from 'hono'

export function corsMiddleware(allowedOrigins: string[] = ['http://localhost:3000']) {
  return async (c: Context, next: () => Promise<void>) => {
    const origin = c.req.header('origin')
    const respHeaders: Record<string, string> = {}
    if (origin && allowedOrigins.includes(origin)) {
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
