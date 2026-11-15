import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
@Schema({ _id: true, versionKey: false }) class WishlistItem { @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true }) productId: Types.ObjectId; @Prop({ default: Date.now }) addedAt: Date; }
const WishlistItemSchema = SchemaFactory.createForClass(WishlistItem);
@Schema({ timestamps: true, versionKey: false, collection: 'wishlists' }) export class Wishlist { @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true }) userId: Types.ObjectId; @Prop({ type: [WishlistItemSchema], default: [] }) items: WishlistItem[]; }
export type WishlistDocument = HydratedDocument<Wishlist>; export const WishlistSchema = SchemaFactory.createForClass(Wishlist);