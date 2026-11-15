import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
export type RoleDocument = HydratedDocument<Role>;
@Schema({ timestamps: true, versionKey: false, collection: 'roles' })
export class Role { @Prop({ required: true }) name: string; @Prop({ required: true, unique: true }) slug: string; @Prop({ type: [String], default: [] }) permissions: string[]; }
export const RoleSchema = SchemaFactory.createForClass(Role);