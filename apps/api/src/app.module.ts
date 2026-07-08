import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { IssuesModule } from './modules/issues/issues.module';
import { CommentsModule } from './modules/comments/comments.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { UploadModule } from './modules/upload/upload.module';
import { AdminExportModule } from './modules/admin-export/admin-export.module';

/**
 * Root module. Feature modules are added here per migration phase:
 *   Phase 1: PrismaModule + HealthModule
 *   Phase 2: CommonModule — cross-cutting guards/pipe/interceptor/filter
 *   Phase 3: read-only domains — Users, AuditLog, Dashboard, Notifications (GET)
 *   Phase 4: write/admin — Issues, Comments, Notifications (PATCH), Admin
 *   Phase 5 (this): high-risk — Auth handler bridge, Upload (multipart/base64),
 *                   AdminExport (streaming)
 *   Phase 6: final golden verification + production cutover
 */
@Module({
  imports: [
    PrismaModule,
    CommonModule,
    HealthModule,
    UsersModule,
    AuditLogModule,
    DashboardModule,
    NotificationsModule,
    IssuesModule,
    CommentsModule,
    AdminModule,
    AuthModule,
    UploadModule,
    AdminExportModule,
  ],
})
export class AppModule {}
