import { Context } from 'hono'
import { getServerSession } from '../lib/session'

const PUBLIC_PATHS = new Set(['/health', '/api/health', '/api/db-check'])

export async function sessionMiddleware(c: Context, next: () => Promise<void>) {
  try {
    const pathname = new URL(c.req.url).pathname
    const isPublic = PUBLIC_PATHS.has(pathname) || pathname === '/api/auth' || pathname.startsWith('/api/auth/')

    if (!isPublic) {
      const session = await getServerSession(c.req.raw.headers)
      ;(c as any).session = session
    }
  } catch (err) {
    console.warn('session middleware error', err)
  }
  await next()
}
