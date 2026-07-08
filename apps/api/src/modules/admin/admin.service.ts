import { Inject, Injectable } from '@nestjs/common';
import type { Role } from '@workspace/database';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * AdminService — VERBATIM port of the Prisma logic in
 * apps/web/server/routes/admin.ts. Authorization, validation, self-demote and
 * last-admin guards live in the controller (matching the Hono handler layout).
 */
@Injectable()
export class AdminService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listUsers(params: {
    search: string;
    role: Role | null;
    page: number;
    pageSize: number;
  }) {
    const { search, role, page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {
      ...(role ? { role } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.client.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
      this.prisma.client.user.count({ where }),
    ]);

    return { users, total, page, pageSize };
  }

  getUser(userId: string) {
    return this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
  }

  countAdmins() {
    return this.prisma.client.user.count({ where: { role: 'ADMIN' } });
  }

  async updateRole(userId: string, role: Role) {
    await this.prisma.client.user.update({
      where: { id: userId },
      data: { role },
    });
    return { success: true };
  }

  getUsersByIds(ids: string[]) {
    return this.prisma.client.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, role: true },
    });
  }

  bulkUpdateRole(ids: string[], role: Role) {
    return this.prisma.client.user.updateMany({
      where: { id: { in: ids } },
      data: { role },
    });
  }
}
