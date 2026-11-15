import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type AiNegotiationLogDocument = HydratedDocument<AiNegotiationLog>;

@Schema({ timestamps: true, versionKey: false, collection: 'aiNegotiationLogs' })
export class AiNegotiationLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product' }) productId?: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' }) buyerId?: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SellerProfile' }) sellerId?: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.Decimal128, min: 0 }) offerAmount?: Types.Decimal128;
  @Prop({ type: MongooseSchema.Types.Decimal128, min: 0 }) counterAmount?: Types.Decimal128;
  @Prop({ enum: ['SUBMITTED', 'ACCEPTED', 'COUNTERED', 'REJECTED'], default: 'SUBMITTED' }) status: string;
  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] }) messages: Record<string, unknown>[];
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) metadata: Record<string, unknown>;
}

export const AiNegotiationLogSchema = SchemaFactory.createForClass(AiNegotiationLog);
