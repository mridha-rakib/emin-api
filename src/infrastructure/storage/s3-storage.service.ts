import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, GetObjectCommand, ObjectCannedACL, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export const IMAGE_FOLDERS = ['products', 'services'] as const;
export type ImageFolder = (typeof IMAGE_FOLDERS)[number];
export type StorageFolder = ImageFolder | 'avatars';

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export interface StoredImage {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

@Injectable()
export class S3StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly client?: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly publicBaseUrl: string;
  private readonly objectAcl?: ObjectCannedACL;

  constructor(config: ConfigService) {
    this.bucket = (config.get<string>('S3_BUCKET_NAME') ?? '').trim();
    this.region = (config.get<string>('S3_REGION') ?? '').trim();
    const accessKeyId = (config.get<string>('S3_ACCESS_KEY_ID') ?? '').trim();
    const secretAccessKey = (config.get<string>('S3_SECRET_ACCESS_KEY') ?? '').trim();

    // The bucket has no public-read policy, so objects must carry their own ACL to be viewable on the site.
    // Set S3_OBJECT_ACL=none once a bucket policy or CloudFront distribution serves the images instead.
    const acl = (config.get<string>('S3_OBJECT_ACL') ?? 'public-read').trim();
    this.objectAcl = acl === 'none' ? undefined : (acl as ObjectCannedACL);

    this.publicBaseUrl = (
      config.get<string>('S3_PUBLIC_BASE_URL')?.trim() || `https://${this.bucket}.s3.${this.region}.amazonaws.com`
    ).replace(/\/+$/, '');

    if (this.bucket && this.region && accessKeyId && secretAccessKey) {
      this.client = new S3Client({ region: this.region, credentials: { accessKeyId, secretAccessKey } });
    } else {
      this.logger.warn('S3 is not configured. Set S3_BUCKET_NAME, S3_REGION, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.');
    }
  }

  async uploadImage(file: { buffer: Buffer; mimetype: string; size: number }, folder: StorageFolder, ownerId: string): Promise<StoredImage> {
    const client = this.requireClient();
    const extension = ALLOWED_IMAGE_TYPES[file.mimetype];
    if (!extension) {
      throw new BadRequestException('Only JPEG, PNG, WebP, GIF or AVIF images can be uploaded.');
    }
    if (!file.size || file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Images must be between 1 byte and 10 MB.');
    }

    const now = new Date();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const key = `${folder}/${ownerId}/${now.getUTCFullYear()}/${month}/${randomUUID()}.${extension}`;

    try {
      await client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=31536000, immutable',
        ACL: this.objectAcl,
      }));
    } catch (error) {
      this.logger.error(`S3 upload failed for ${key}`, error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Image upload failed. Please try again.');
    }

    return { key, url: this.publicUrl(key), size: file.size, contentType: file.mimetype };
  }

  /**
   * Stores sensitive files (identity documents): never public, encrypted at rest,
   * and only readable through short-lived signed URLs.
   */
  async uploadPrivate(file: { buffer: Buffer; mimetype: string }, key: string) {
    const client = this.requireClient();
    try {
      await client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'private, no-store',
        ServerSideEncryption: 'AES256',
      }));
    } catch (error) {
      this.logger.error(`S3 private upload failed for ${key}`, error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Document upload failed. Please try again.');
    }
    return key;
  }

  signedReadUrl(key: string, expiresInSeconds = 300) {
    return getSignedUrl(this.requireClient(), new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn: expiresInSeconds });
  }

  async deleteKey(key: string) {
    if (!this.client) return;
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (error) {
      this.logger.warn(`S3 delete failed for ${key}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteByUrl(url: string) {
    const key = this.keyFromUrl(url);
    if (key) await this.deleteKey(key);
  }

  publicUrl(key: string) {
    return `${this.publicBaseUrl}/${key}`;
  }

  keyFromUrl(url: string) {
    const prefix = `${this.publicBaseUrl}/`;
    return url.startsWith(prefix) ? decodeURIComponent(url.slice(prefix.length)) : undefined;
  }

  private requireClient() {
    if (!this.client) {
      throw new InternalServerErrorException('Image storage is not configured on the server.');
    }
    return this.client;
  }
}
