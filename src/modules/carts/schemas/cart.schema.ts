import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
@Schema({ _id: true, versionKey: false }) class CartItem { @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true }) productId: Types.ObjectId; @Prop({ required: true, min: 1 }) quantity: number; @Prop({ default: Date.now }) addedAt: Date; }
const CartItemSchema = SchemaFactory.createForClass(CartItem);
@Schema({ timestamps: true, versionKey: false, collection: 'carts' }) export class Cart { @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true }) userId: Types.ObjectId; @Prop({ type: [CartItemSchema], default: [] }) items: CartItem[]; }
export type CartDocument = HydratedDocument<Cart>; export const CartSchema = SchemaFactory.createForClass(Cart); CartSchema.index({ userId: 1, 'items.productId': 1 }, { unique: true, partialFilterExpression: { 'items.productId': { $exists: true } } });