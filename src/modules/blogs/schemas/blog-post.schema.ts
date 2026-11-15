import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type BlogPostDocument = HydratedDocument<BlogPost>;

@Schema({ timestamps: true, versionKey: false, collection: 'blogs' })
export class BlogPost {
  @Prop({ required: true }) title: string;
  @Prop({ required: true, unique: true }) slug: string;
  @Prop() excerpt?: string;
  @Prop({ required: true }) content: string;
  @Prop() coverImage?: string;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' }) authorId?: Types.ObjectId;
  @Prop({ type: [String], default: [] }) tags: string[];
  @Prop({ enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT' }) status: string;
  @Prop() publishedAt?: Date;
}

export const BlogPostSchema = SchemaFactory.createForClass(BlogPost);
