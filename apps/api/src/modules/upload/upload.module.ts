import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  // CommonModule exports SessionService, which UploadService injects.
  imports: [CommonModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
