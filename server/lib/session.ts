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
  const session = await auth.api.getSession({ headers } as any)
  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  })

  if (!user) {
    return null
  }

  return { user }
}
