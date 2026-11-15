import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type BookingDocument = HydratedDocument<Booking>;

@Schema({ timestamps: true, versionKey: false, collection: 'bookings' })
export class Booking {
  @Prop({ required: true }) customerName: string;
  @Prop() customerEmail?: string;
  @Prop() customerPhone?: string;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' }) customerId?: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SellerProfile' }) providerId?: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product' }) serviceId?: Types.ObjectId;
  @Prop({ required: true }) serviceTitle: string;
  @Prop() serviceCategory?: string;
  @Prop() scheduledAt?: Date;
  @Prop() location?: string;
  @Prop({ type: MongooseSchema.Types.Decimal128, min: 0 }) amount?: Types.Decimal128;
  @Prop({ default: 'USD' }) currency: string;
  @Prop({ enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' }) status: string;
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) metadata: Record<string, unknown>;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
