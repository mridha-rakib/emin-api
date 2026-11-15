import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
import { PageStatus } from '../../../common/enums/domain.enums';
@Schema({ timestamps: true, versionKey: false, collection: 'pages' }) export class Page { @Prop({ required: true }) title: string; @Prop({ required: true, unique: true }) slug: string; @Prop({ type: MongooseSchema.Types.Mixed, required: true }) content: Record<string, unknown>; @Prop() seoTitle?: string; @Prop() seoDescription?: string; @Prop({ enum: PageStatus, default: PageStatus.DRAFT }) status: PageStatus; }
export type PageDocument = HydratedDocument<Page>; export const PageSchema = SchemaFactory.createForClass(Page);