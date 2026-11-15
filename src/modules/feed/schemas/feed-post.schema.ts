import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type FeedPostDocument = HydratedDocument<FeedPost>;

@Schema({ timestamps: true, versionKey: false, collection: 'feedPosts' })
export class FeedPost {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true }) userId?: Types.ObjectId;
  @Prop() authorName?: string;
  @Prop() authorRole?: string;
  @Prop({ required: true }) title: string;
  @Prop() description?: string;
  @Prop() category?: string;
  @Prop() budget?: string;
  @Prop() location?: string;
  @Prop({ type: [String], default: [] }) attachments: string[];
  @Prop({ enum: ['OPEN', 'IN_PROGRESS', 'CLOSED'], default: 'OPEN' }) status: string;
  @Prop({ default: 0, min: 0 }) likes: number;
  @Prop({ default: 0, min: 0 }) comments: number;
  @Prop({ type: [String], default: [] }) likedBy: string[];
  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] }) commentItems: Array<Record<string, unknown>>;
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) metadata: Record<string, unknown>;
}

export const FeedPostSchema = SchemaFactory.createForClass(FeedPost);
