import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedPost, FeedPostSchema } from './schemas/feed-post.schema';
import { FeedPostRepository } from './repositories/feed-post.repository';
import { FeedPostService } from './services/feed-post.service';
import { FeedPostController } from './controllers/feed-post.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: FeedPost.name, schema: FeedPostSchema }]), AuthModule],
  controllers: [FeedPostController],
  providers: [FeedPostRepository, FeedPostService],
  exports: [MongooseModule, FeedPostRepository, FeedPostService],
})
export class FeedModule {}