import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global so every feature module can inject `PrismaService` without re-importing
 * PrismaModule. Mirrors the Hono server, where every route file imports the same
 * `prisma` singleton directly.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
