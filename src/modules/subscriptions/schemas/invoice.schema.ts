import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({ timestamps: true, versionKey: false, collection: 'invoices' })
export class Invoice {
  @Prop({ required: true, unique: true }) invoiceNumber: string;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'UserSubscription' }) subscriptionId?: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.Decimal128, min: 0, required: true }) amount: Types.Decimal128;
  @Prop({ default: 'USD' }) currency: string;
  @Prop({ enum: ['PENDING', 'PAID', 'FAILED', 'VOID'], default: 'PENDING' }) status: string;
  @Prop() paidAt?: Date;
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) metadata: Record<string, unknown>;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
