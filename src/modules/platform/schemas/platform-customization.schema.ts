import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type PlatformCustomizationDocument = HydratedDocument<PlatformCustomization>;

@Schema({ timestamps: true, versionKey: false, collection: 'platformCustomizations' })
export class PlatformCustomization {
  @Prop({ required: true, unique: true, default: 'default' }) key: string;
  @Prop() logoUrl?: string;
  @Prop() faviconUrl?: string;
  @Prop() primaryColor?: string;
  @Prop() secondaryColor?: string;
  @Prop() supportEmail?: string;
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) branding: Record<string, unknown>;
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) aiRules: Record<string, unknown>;
}

export const PlatformCustomizationSchema = SchemaFactory.createForClass(PlatformCustomization);
