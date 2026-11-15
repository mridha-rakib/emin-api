import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { IdentityVerificationService, IDENTITY_IMAGE_TYPES, MAX_IDENTITY_IMAGE_BYTES } from './identity-verification.service';

const documentUploadOptions = (files: number): MulterOptions => ({
  storage: memoryStorage(),
  limits: { fileSize: MAX_IDENTITY_IMAGE_BYTES, files },
  fileFilter: (_req, file, callback) => {
    if (!IDENTITY_IMAGE_TYPES[file.mimetype]) {
      callback(new BadRequestException('Documents must be JPEG, PNG or WebP images.'), false);
      return;
    }
    callback(null, true);
  },
});

type Uploads = {
  documentFront?: Express.Multer.File[];
  documentBack?: Express.Multer.File[];
};

@Controller('identity-verification')
export class IdentityVerificationController {
  constructor(private readonly service: IdentityVerificationService) {}

  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    return this.service.myStatus(authorization);
  }

  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'documentFront', maxCount: 1 }, { name: 'documentBack', maxCount: 1 }], documentUploadOptions(2)))
  submit(
    @UploadedFiles() files: Uploads,
    @Body('documentType') documentType: string | undefined,
    @Headers('authorization') authorization?: string,
  ) {
    return this.service.submit(authorization, documentType, files ?? {});
  }

  @Post('items/:side')
  @UseInterceptors(FileInterceptor('file', documentUploadOptions(1)))
  submitItem(
    @Param('side') side: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('documentType') documentType: string | undefined,
    @Headers('authorization') authorization?: string,
  ) {
    return this.service.submitItem(authorization, side, documentType, file);
  }

  @Post('liveness/:pose')
  @UseInterceptors(FileInterceptor('file', documentUploadOptions(1)))
  submitLivenessFrame(
    @Param('pose') pose: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Headers('authorization') authorization?: string,
  ) {
    return this.service.submitLivenessFrame(authorization, pose, file);
  }
}

@Controller('admin/identity-verifications')
export class AdminIdentityVerificationController {
  constructor(private readonly service: IdentityVerificationService) {}

  @Get()
  list(
    @Headers('authorization') authorization?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.adminList(authorization, status, Number(page) || 1, Number(limit) || 25);
  }

  @Get(':id')
  detail(@Param('id', ParseObjectIdPipe) id: string, @Headers('authorization') authorization?: string) {
    return this.service.adminDetail(authorization, id);
  }

  @Post(':id/items/:side/approve')
  approveItem(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('side') side: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.service.adminReviewItem(authorization, id, side, 'approve');
  }

  @Post(':id/items/:side/reject')
  rejectItem(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('side') side: string,
    @Body('reason') reason: string | undefined,
    @Headers('authorization') authorization?: string,
  ) {
    return this.service.adminReviewItem(authorization, id, side, 'reject', reason);
  }

  @Post(':id/unblock-uploads')
  unblockUploads(
    @Param('id', ParseObjectIdPipe) id: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.service.adminUnblockUploads(authorization, id);
  }
}
