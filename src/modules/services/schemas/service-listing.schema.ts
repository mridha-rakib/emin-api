import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ServiceListingDocument = HydratedDocument<ServiceListing>;

@Schema({ timestamps: true, versionKey: false, collection: 'services' })
export class ServiceListing {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SellerProfile' }) providerId?: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true }) providerUserId?: Types.ObjectId;
  @Prop({ lowercase: true, trim: true, index: true }) providerEmail?: string;
  @Prop() providerName?: string;
  @Prop() role?: string;
  @Prop({ default: false, index: true }) featured: boolean;
  @Prop({ required: true }) title: string;
  @Prop() slug?: string;
  @Prop() description?: string;
  @Prop() category?: string;
  @Prop() duration?: string;
  @Prop({ type: [String], default: [] }) tags: string[];
  @Prop({ type: MongooseSchema.Types.Decimal128, min: 0 }) price?: Types.Decimal128;
  @Prop({ default: 'USD' }) currency: string;
  @Prop({ type: [String], default: [] }) images: string[];
  @Prop({ enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'], default: 'ACTIVE' }) status: string;
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) metadata: Record<string, unknown>;
}

export const ServiceListingSchema = SchemaFactory.createForClass(ServiceListing);
