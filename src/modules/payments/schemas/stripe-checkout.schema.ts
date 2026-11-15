import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type StripeCheckoutDocument = HydratedDocument<StripeCheckout>;

@Schema({ timestamps: true, versionKey: false, collection: 'stripeCheckouts' })
export class StripeCheckout {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true }) userId: Types.ObjectId;
  @Prop({ required: true, enum: ['SUBSCRIPTION', 'MARKETPLACE', 'SERVICE'] }) purpose: 'SUBSCRIPTION' | 'MARKETPLACE' | 'SERVICE';
  @Prop({ required: true, min: 0 }) amount: number;
  @Prop({ default: 'CHF' }) currency: string;
  @Prop({ enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING', index: true }) status: 'PENDING' | 'PAID' | 'FAILED';
  @Prop({ unique: true, sparse: true }) stripeSessionId?: string;
  @Prop({ type: MongooseSchema.Types.Mixed, required: true }) payload: Record<string, unknown>;
  @Prop({ type: MongooseSchema.Types.Mixed }) result?: Record<string, unknown>;
  @Prop() paidAt?: Date;
}

export const StripeCheckoutSchema = SchemaFactory.createForClass(StripeCheckout);
