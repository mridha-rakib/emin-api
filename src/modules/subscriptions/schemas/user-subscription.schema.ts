import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type UserSubscriptionDocument = HydratedDocument<UserSubscription>;

@Schema({ timestamps: true, versionKey: false, collection: 'subscriptions' })
export class UserSubscription {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SubscriptionPlan' }) planId?: Types.ObjectId;
  @Prop({ required: true }) planName: string;
  @Prop({ enum: ['monthly', 'yearly'], default: 'monthly' }) billingCycle: string;
  @Prop({ type: MongooseSchema.Types.Decimal128, min: 0, required: true }) amount: Types.Decimal128;
  @Prop({ default: 'USD' }) currency: string;
  @Prop({ enum: ['ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'], default: 'ACTIVE' }) status: string;
  @Prop() startsAt?: Date;
  @Prop() endsAt?: Date;
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) paymentDetails: Record<string, unknown>;
}

export const UserSubscriptionSchema = SchemaFactory.createForClass(UserSubscription);
