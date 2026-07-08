import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * UsersService — read-only queries, ported 1:1 from apps/web/server/routes/users.ts.
 */
@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  // GET /api/users — list all users (member picker). Returns an array.
  listUsers() {
    return this.prisma.client.user.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  }

  // GET /api/users/profile — current user profile with issue count.
  getProfile(userId: string) {
    return this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { issues: true } },
      },
    });
  }
}
