import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../../modules/auth/auth.module';
import { S3StorageService } from './s3-storage.service';
import { UploadsController } from './uploads.controller';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [UploadsController],
  providers: [S3StorageService],
  exports: [S3StorageService],
})
export class StorageModule {}
