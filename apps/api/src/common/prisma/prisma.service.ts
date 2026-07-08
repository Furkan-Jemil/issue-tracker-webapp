import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { prisma } from '@workspace/database';
import type { PrismaClient } from '@workspace/database';

/**
 * PrismaService — thin wrapper around the shared, lazily-instantiated
 * PrismaClient singleton exported by `@workspace/database`.
 *
 * We deliberately DO NOT construct a new PrismaClient here. The singleton in
 * `@workspace/database/index.ts`:
 *   - caches the client on `globalThis` (avoids connection storms + HMR leaks),
 *   - uses the tuned `@prisma/adapter-pg` + `pg.Pool` connection,
 *   - normalizes `DATABASE_URL` (strips `channel_binding=require`),
 *   - instantiates lazily via a Proxy so importing this file never throws
 *     "DATABASE_URL is not set" during a build's static-analysis phase.
 *
 * Re-using it guarantees the NestJS app behaves byte-for-byte like the existing
 * Hono server, which imports the exact same singleton.
 */
@Injectable()
export class PrismaService implements OnModuleDestroy {
  /** The shared PrismaClient singleton. Use for all database access. */
  readonly client: PrismaClient = prisma;

  async onModuleDestroy(): Promise<void> {
    // Long-lived Node process: disconnect the shared pool on shutdown.
    // Best-effort — never let a disconnect error crash shutdown.
    try {
      await this.client.$disconnect();
    } catch {
      /* ignore */
    }
  }
}
