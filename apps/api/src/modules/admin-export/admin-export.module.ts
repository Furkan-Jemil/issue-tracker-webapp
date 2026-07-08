import { Module } from '@nestjs/common';
import { AdminExportController } from './admin-export.controller';
import { AdminExportService } from './admin-export.service';

@Module({
  controllers: [AdminExportController],
  providers: [AdminExportService],
})
export class AdminExportModule {}
