import { Hono } from 'hono'
import type { Context } from 'hono'
import { randomUUID } from 'node:crypto'

import bcrypt from 'bcryptjs'
import prisma from '../../src/lib/prisma'
import { auth } from '../../src/lib/auth'

// authHandler accepts a Hono Context, converts it to a standard Fetch Request
// for `better-auth`, then returns the handler's Response.
export async function authHandler(c: Context): Promise<Response> {
  try {
    const url = c.req.url
    const method = c.req.method
    const parsed = new URL(url)
    const normalizedPath = parsed.pathname
      .replace('/api/auth/signin', '/api/auth/sign-in')
      .replace('/api/auth/signup', '/api/auth/sign-up')
      .replace('/api/auth/signout', '/api/auth/sign-out')
      .replace('/api/auth/session', '/api/auth/get-session')

    // Direct Hono-handled endpoints for common auth flows. These provide a
    // deterministic Hono-native implementation while still falling back to the
    // Better Auth handler for other routes.

    // POST /api/auth/sign-in/email -> deterministic sign-in (Prisma + bcrypt)
    if (method === 'POST' && normalizedPath === '/api/auth/sign-in/email') {
      let body: any = {}
      const contentType = c.req.header('content-type') || ''
      if (contentType.includes('application/json')) {
        body = await c.req.json()
      } else {
        const formData = await c.req.formData()
        body = Object.fromEntries(formData)
      }

      const email = typeof body.email === 'string' ? body.email.trim() : ''
      const password = typeof body.password === 'string' ? body.password : ''
      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'email and password required' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        })
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, role: true, password: true },
      })

      let storedPassword: string | null = user?.password ?? null
      if (!storedPassword && user?.id) {
        const acct = await prisma.account.findFirst({
          where: { userId: user.id, providerId: { in: ['credential', 'email'] } },
          select: { password: true },
        })
        storedPassword = acct?.password ?? null
      }

      if (!storedPassword || !(await bcrypt.compare(password, storedPassword))) {
        return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        })
      }

      if (!user) {
        return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        })
      }

      const sessionToken = randomUUID().replace(/-/g, '')
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      await prisma.session.create({
        data: { userId: user.id, token: sessionToken, expiresAt },
      })

      const cookieParts = [
        `better-auth.session_token=${sessionToken}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
      ]
      if (process.env.NODE_ENV === 'production') {
        cookieParts.push('Secure')
      }

      return new Response(JSON.stringify({ redirect: false, token: sessionToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'set-cookie': cookieParts.join('; ') },
      })
    }

    // POST /api/auth/sign-up/email -> use Better Auth API to register a user
    if (method === 'POST' && normalizedPath === '/api/auth/sign-up/email') {
      const contentType = c.req.header('content-type') || ''
      let body: any = {}
      if (contentType.includes('application/json')) body = await c.req.json()
      else {
        const fd = await c.req.formData()
        body = Object.fromEntries(fd)
      }

      const res = await (auth as any).api.signUpEmail({ body })
      // If the API returned a plain object-like response, coerce to Response
      if (res && typeof res === 'object' && 'status' in res && 'body' in res) {
        const headers = res.headers || { 'content-type': 'application/json' }
        const bodyStr = typeof res.body === 'string' ? res.body : JSON.stringify(res.body)
        return new Response(bodyStr, { status: res.status, headers })
      }
      return new Response(JSON.stringify(res), { status: 200, headers: { 'content-type': 'application/json' } })
    }

    // GET /api/auth/get-session -> return the current user from the session cookie.
    if (method === 'GET' && normalizedPath === '/api/auth/get-session') {
      const cookieHeader = c.req.header('cookie') || ''
      const cookies = cookieHeader.split(';').map((s) => s.trim())
      const tokenCookie = cookies.find((v) => v.startsWith('better-auth.session_token='))
      if (!tokenCookie) return new Response(JSON.stringify(null), { status: 200, headers: { 'content-type': 'application/json' } })

      const token = tokenCookie.split('=')[1]
      const session = await prisma.session.findUnique({ where: { token }, select: { userId: true, expiresAt: true } })
      if (!session) return new Response(JSON.stringify(null), { status: 200, headers: { 'content-type': 'application/json' } })
      if (session.expiresAt.getTime() < Date.now()) return new Response(JSON.stringify(null), { status: 200, headers: { 'content-type': 'application/json' } })

      const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, email: true, name: true, role: true } })
      if (!user) return new Response(JSON.stringify(null), { status: 200, headers: { 'content-type': 'application/json' } })

      return new Response(JSON.stringify({ user }), { status: 200, headers: { 'content-type': 'application/json' } })
    }

    if (method === 'POST' && normalizedPath === '/api/auth/sign-out') {
      const cookieHeader = c.req.header('cookie') || ''
      const cookies = cookieHeader.split(';').map((s) => s.trim())
      const tokenCookie = cookies.find((v) => v.startsWith('better-auth.session_token='))

      if (tokenCookie) {
        const token = tokenCookie.split('=')[1]
        await prisma.session.deleteMany({ where: { token } })
      }

      const expiresCookie = [
        'better-auth.session_token=',
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        'Max-Age=0',
      ]
      if (process.env.NODE_ENV === 'production') {
        expiresCookie.push('Secure')
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'set-cookie': expiresCookie.join('; '),
        },
      })
    }

    const handler = 'handler' in auth ? (auth as any).handler : auth as any

    console.log('authHandler incoming', method, url)
    // Build a Fetch Request with explicit headers and body so better-auth
    // receives the cookie and content-type exactly as the original request.
    const rawReq = c.req.raw
    const forwardedHeaders = new Headers()
    try {
      for (const [k, v] of (rawReq.headers as any).entries()) {
        forwardedHeaders.set(k, v as any)
      }
    } catch (e) {
      // Fallback: copy via c.req.headers iterator if raw headers don't expose .entries()
      try {
        for (const [k, v] of ((c.req as any).headers || [])) {
          forwardedHeaders.set(k, v as any)
        }
      } catch (_) {}
    }
    const hasBody = method !== 'GET' && method !== 'HEAD'
    const bodyText = hasBody ? await rawReq.text() : undefined
    console.log('authHandler forwarding cookie:', forwardedHeaders.get('cookie'))
    const originalFetchReq = new Request(url, { method, headers: forwardedHeaders, body: bodyText })
    console.log('authHandler forwarding original URL', url)
    let res = await handler(originalFetchReq as any)

    // If original returned 404, retry with stripped prefix so handlers expecting '/sign-in' style paths work.
    if (res && typeof res === 'object' && 'status' in res && res.status === 404) {
      const prefix = '/api/auth'
      let path = parsed.pathname
      if (path.startsWith(prefix)) {
        path = path.slice(prefix.length) || '/'
      }
      const forwardedUrl = `${parsed.protocol}//${parsed.host}${path}${parsed.search}`
      console.log('authHandler retrying with stripped prefix ->', forwardedUrl)
      // Retry with stripped prefix — preserve headers/body
      const forwardedHeaders2 = forwardedHeaders
      const fetchReq2 = new Request(forwardedUrl, { method, headers: forwardedHeaders2, body: bodyText })
      console.log('authHandler forwarding stripped URL with cookie:', forwardedHeaders2.get('cookie'))
      res = await handler(fetchReq2 as any)
    }
    console.log('authHandler got response', res && res.status)

    if (res instanceof Response) {
      return res
    }

    // Try to coerce a plain object-like response
    if (res && typeof res === 'object' && 'status' in res && 'body' in res) {
      const headers = res.headers || { 'content-type': 'application/json' }
      const bodyStr = typeof res.body === 'string' ? res.body : JSON.stringify(res.body)
      return new Response(bodyStr, { status: res.status, headers })
    }

    return new Response(String(res))
  } catch (err: any) {
    console.error('authHandler error:', err?.message ?? err, err?.stack ?? '')
    const body = { error: String(err?.message ?? err) }
    return new Response(JSON.stringify(body), { status: 500, headers: { 'content-type': 'application/json' } })
  }
}

const app = new Hono()
  .all('/', async (c) => authHandler(c))
  .all('/*', async (c) => authHandler(c))

export default app

