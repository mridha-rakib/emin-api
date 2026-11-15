import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogPost, BlogPostSchema } from './schemas/blog-post.schema';
import { BlogPostRepository } from './repositories/blog-post.repository';
import { BlogPostService } from './services/blog-post.service';
import { BlogPostController } from './controllers/blog-post.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: BlogPost.name, schema: BlogPostSchema }])],
  controllers: [BlogPostController],
  providers: [BlogPostRepository, BlogPostService],
  exports: [MongooseModule, BlogPostRepository, BlogPostService],
})
export class BlogsModule {}