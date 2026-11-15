import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type HeldPayoutDocument = HydratedDocument<HeldPayout>;

@Schema({ timestamps: true, versionKey: false, collection: 'heldPayouts' })
export class HeldPayout {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true }) payeeId?: Types.ObjectId;
  @Prop({ enum: ['provider', 'seller'] }) role?: string;
  @Prop({ required: true, enum: ['BOOKING', 'ORDER'] }) sourceType: string;
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true }) sourceId: Types.ObjectId;
  @Prop() title?: string;
  @Prop({ type: MongooseSchema.Types.Decimal128, required: true }) amount: Types.Decimal128;
  @Prop({ default: 'CHF' }) currency: string;
  @Prop({ enum: ['HELD', 'TRANSFERRED', 'PENDING'], default: 'HELD', index: true }) status: string;
  @Prop() detail?: string;
  @Prop() stripeTransferId?: string;
  @Prop() releasedAt?: Date;
}

export const HeldPayoutSchema = SchemaFactory.createForClass(HeldPayout);
HeldPayoutSchema.index({ sourceType: 1, sourceId: 1 }, { unique: true });
