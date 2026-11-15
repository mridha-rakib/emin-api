import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type SubscriptionPlanDocument = HydratedDocument<SubscriptionPlan>;

@Schema({ timestamps: true, versionKey: false, collection: 'subscriptionPlans' })
export class SubscriptionPlan {
  @Prop({ required: true }) name: string;
  @Prop({ required: true, unique: true }) slug: string;
  @Prop({ type: MongooseSchema.Types.Decimal128, min: 0, required: true }) monthlyPrice: Types.Decimal128;
  @Prop({ type: MongooseSchema.Types.Decimal128, min: 0 }) yearlyPrice?: Types.Decimal128;
  @Prop({ default: 'CHF' }) currency: string;
  @Prop() description?: string;
  @Prop({ type: [String], default: [] }) features: string[];
  @Prop({ type: [String], default: [] }) notIncluded: string[];
  @Prop({ default: false }) popular: boolean;
  @Prop({ default: true }) active: boolean;
}

export const SubscriptionPlanSchema = SchemaFactory.createForClass(SubscriptionPlan);
