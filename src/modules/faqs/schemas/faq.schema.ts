import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type FaqDocument = HydratedDocument<Faq>;

@Schema({ timestamps: true, versionKey: false, collection: 'faqs' })
export class Faq {
  @Prop({ required: true }) question: string;
  @Prop({ required: true }) answer: string;
  @Prop() category?: string;
  @Prop({ default: 0 }) sortOrder: number;
  @Prop({ default: true }) active: boolean;
}

export const FaqSchema = SchemaFactory.createForClass(Faq);
