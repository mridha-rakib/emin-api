import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RawPayloadDto } from '../../../common/dto/raw-payload.dto';
import { AuthService } from '../../auth/auth.service';
import { FeedPostRepository } from '../repositories/feed-post.repository';

@Injectable()
export class FeedPostService implements OnModuleInit {
  private readonly logger = new Logger(FeedPostService.name);

  constructor(
    private readonly repository: FeedPostRepository,
    private readonly auth: AuthService,
  ) {}

  async onModuleInit() {
    try {
      const result = await this.repository.recountAll();
      if (result.modifiedCount) {
        this.logger.log(`Repaired like/comment counters on ${result.modifiedCount} feed post(s).`);
      }
    } catch (error) {
      this.logger.warn(`Feed counter repair skipped: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async create(dto: RawPayloadDto, authorization?: string) {
    const author = await this.currentAuthor(authorization);
    const payload = dto.payload ?? {};
    const post = await this.repository.createOne({
      ...payload,
      userId: author.id,
      authorName: author.name,
      authorRole: typeof payload.authorRole === 'string' ? payload.authorRole : undefined,
    });
    return this.repository.findByIdWithAuthor(String(post._id));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginateWithAuthors({}, query);
  }

  findOne(id: string) {
    return this.repository.findByIdWithAuthor(id);
  }

  update(id: string, dto: RawPayloadDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? {} });
  }

  async toggleReaction(id: string, authorization?: string) {
    const author = await this.currentAuthor(authorization);
    await this.repository.toggleLike(id, author.id.toString());
    return this.repository.findByIdWithAuthor(id);
  }

  async addComment(id: string, dto: RawPayloadDto, authorization?: string) {
    const author = await this.currentAuthor(authorization);
    const payload = dto.payload ?? {};
    const text = String(payload.text || payload.comment || '').trim();
    if (!text) {
      throw new BadRequestException('Comment text is required.');
    }

    const comment = {
      id: new Types.ObjectId().toString(),
      authorId: author.id.toString(),
      authorName: author.name,
      authorAvatar: author.avatar,
      authorRole: payload.authorRole || author.profession || 'Community Member',
      text,
      createdAt: new Date(),
    };

    await this.repository.updateOne(
      { _id: id },
      { $push: { commentItems: comment }, $inc: { comments: 1 } },
    );
    return this.repository.findByIdWithAuthor(id);
  }

  remove(id: string) {
    return this.repository.deleteOne({ _id: id });
  }

  private async currentAuthor(authorization?: string) {
    const user = await this.auth.me(authorization);
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'User';
    return {
      id: new Types.ObjectId(String(user._id)),
      name,
      avatar: typeof user.avatar === 'string' ? user.avatar : undefined,
      profession: typeof user.profession === 'string' ? user.profession : undefined,
    };
  }
}
