import { auth } from '../../lib/auth'
import prisma from '../../lib/prisma'
import type { Role } from '@prisma/client'

export type ServerUser = {
  id: string
  name: string
  email: string
  role: Role
}

export type ServerSession = {
  user: ServerUser
}

export async function getServerSession(headers: Headers): Promise<ServerSession | null> {
  // 1. Try Better Auth's native session lookup
  try {
    const session = await auth.api.getSession({ headers } as any)
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, role: true },
      })
      if (user) {
        return { user }
      }
    }
  } catch (err) {
    console.warn('Better Auth session lookup failed:', err)
  }

  // 2. Fallback: Manually resolve Hono custom credentials session token (without signature dots)
  const cookieHeader = headers.get('cookie') || ''
  const cookies = cookieHeader.split(';').map((s) => s.trim())
  const tokenCookie = cookies.find((v) => v.startsWith('better-auth.session_token='))
  if (tokenCookie) {
    const rawToken = tokenCookie.split('=')[1]
    if (rawToken && !rawToken.includes('.')) {
      const decodedToken = decodeURIComponent(rawToken)
      const dbSession = await prisma.session.findFirst({
        where: {
          token: decodedToken,
          expiresAt: { gte: new Date() },
        },
        select: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      })
      if (dbSession?.user) {
        return { user: dbSession.user }
      }
    }
  }

  return null
}
