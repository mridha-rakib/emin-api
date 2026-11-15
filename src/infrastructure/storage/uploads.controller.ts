import { BadRequestException, Controller, Headers, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';
import { AuthService } from '../../modules/auth/auth.service';
import { ALLOWED_IMAGE_TYPES, IMAGE_FOLDERS, ImageFolder, MAX_IMAGE_BYTES, S3StorageService } from './s3-storage.service';

const imageUploadOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_TYPES[file.mimetype]) {
      callback(new BadRequestException('Only JPEG, PNG, WebP, GIF or AVIF images can be uploaded.'), false);
      return;
    }
    callback(null, true);
  },
};

@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly storage: S3StorageService,
    private readonly auth: AuthService,
  ) {}

  @Post('images')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('folder') folder: string | undefined,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.auth.me(authorization);
    if (!file) {
      throw new BadRequestException('Attach an image in the "file" form field.');
    }
    if (!folder || !IMAGE_FOLDERS.includes(folder as ImageFolder)) {
      throw new BadRequestException(`folder must be one of: ${IMAGE_FOLDERS.join(', ')}.`);
    }

    return this.storage.uploadImage(file, folder as ImageFolder, String(user._id ?? user.id));
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.auth.me(authorization);
    if (!file) {
      throw new BadRequestException('Attach an image in the "file" form field.');
    }

    const image = await this.storage.uploadImage(file, 'avatars', String(user._id ?? user.id));
    const { user: updatedUser, previousAvatar } = await this.auth.updateAvatar(authorization, image.url);
    if (previousAvatar && previousAvatar !== image.url) {
      void this.storage.deleteByUrl(previousAvatar);
    }

    return { ...image, user: updatedUser };
  }
}
