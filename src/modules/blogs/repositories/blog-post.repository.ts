import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { BlogPost, BlogPostDocument } from '../schemas/blog-post.schema';

@Injectable()
export class BlogPostRepository extends BaseRepository<BlogPostDocument> {
  constructor(@InjectModel(BlogPost.name) model: Model<BlogPostDocument>) {
    super(model);
  }
}