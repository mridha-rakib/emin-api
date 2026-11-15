import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type PayoutMethodDocument = HydratedDocument<PayoutMethod>;

@Schema({ timestamps: true, versionKey: false, collection: 'payoutMethods' })
export class PayoutMethod {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop() stripeCustomerId?: string;
  @Prop() stripePaymentMethodId?: string;
  @Prop() stripeAccountId?: string;
  @Prop() brand?: string;
  @Prop() last4?: string;
  @Prop() expMonth?: number;
  @Prop() expYear?: number;
  @Prop({ enum: ['ACTIVE', 'PENDING'], default: 'PENDING' }) status: string;
  @Prop() detail?: string;
}

export const PayoutMethodSchema = SchemaFactory.createForClass(PayoutMethod);
