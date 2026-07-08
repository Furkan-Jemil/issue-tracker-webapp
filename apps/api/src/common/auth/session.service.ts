import { Inject, Injectable } from '@nestjs/common';
import type { Role } from '@workspace/database';
import { PrismaService } from '../prisma/prisma.service';
import { auth } from './better-auth';

export type ServerUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type ServerSession = {
  user: ServerUser;
};

/**
 * SessionService — VERBATIM port of apps/web/server/lib/session.ts
 * (`getServerSession`). Resolves the caller's identity through the exact same
 * three fallbacks, in the same order, so mobile (Bearer) and web (cookie) both
 * behave identically to the Hono server:
 *
 *   1. Better Auth native session lookup (`auth.api.getSession`) — the ONLY path
 *      that resolves Better-Auth-issued signed cookies (step 3 deliberately skips
 *      tokens containing a `.`).
 *   2. Bearer token → `prisma.session` lookup (mobile app).
 *   3. Manual `better-auth.session_token` cookie parse for raw (dot-less) tokens.
 *
 * Prisma is injected via explicit @Inject(PrismaService) per the apps/api DI
 * convention (tsx/esbuild strips design:paramtypes metadata).
 */
@Injectable()
export class SessionService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async getServerSession(headers: Headers): Promise<ServerSession | null> {
    const prisma = this.prisma.client;

    // 1. Try Better Auth's native session lookup
    try {
      const session = await auth.api.getSession({ headers } as any);
      if (session?.user?.id) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true, name: true, email: true, role: true },
        });
        if (user) {
          return { user };
        }
      }
    } catch (err) {
      console.warn('Better Auth session lookup failed:', err);
    }

    // 2. Try Bearer token (used by mobile app)
    const authHeader =
      headers.get('authorization') || headers.get('Authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const dbSession = await prisma.session.findFirst({
        where: {
          token,
          expiresAt: { gte: new Date() },
        },
        select: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });
      if (dbSession?.user) {
        return { user: dbSession.user };
      }
    }

    // 3. Fallback: Manually resolve from cookie
    const cookieHeader = headers.get('cookie') || '';
    const cookies = cookieHeader.split(';').map((s) => s.trim());
    const tokenCookie = cookies.find((v) =>
      v.startsWith('better-auth.session_token='),
    );
    if (tokenCookie) {
      const rawToken = tokenCookie.split('=')[1];
      if (rawToken && !rawToken.includes('.')) {
        const decodedToken = decodeURIComponent(rawToken);
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
        });
        if (dbSession?.user) {
          return { user: dbSession.user };
        }
      }
    }

    return null;
  }
}
