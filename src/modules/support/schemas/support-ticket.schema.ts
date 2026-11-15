import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
import { TicketPriority, TicketStatus } from '../../../common/enums/domain.enums';

@Schema({ _id: false, versionKey: false })
class SupportAttachment {
  @Prop({ required: true })
  url: string;

  @Prop()
  type?: string;
}
const SupportAttachmentSchema = SchemaFactory.createForClass(SupportAttachment);

@Schema({ _id: true, versionKey: false })
class SupportMessage {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  senderId?: Types.ObjectId;

  @Prop({ enum: ['user', 'admin', 'guest'], default: 'user' })
  senderRole: 'user' | 'admin' | 'guest';

  @Prop()
  senderName?: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: [SupportAttachmentSchema], default: [] })
  attachments: SupportAttachment[];

  @Prop({ default: Date.now })
  createdAt: Date;
}
const SupportMessageSchema = SchemaFactory.createForClass(SupportMessage);

@Schema({ timestamps: true, versionKey: false, collection: 'supportTickets' })
export class SupportTicket {
  @Prop({ required: true, unique: true })
  ticketNumber: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ lowercase: true, trim: true })
  guestEmail?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  assignedAdminId?: Types.ObjectId;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  category: string;

  @Prop({ enum: TicketPriority, default: TicketPriority.NORMAL })
  priority: TicketPriority;

  @Prop({ enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Prop({ type: [SupportMessageSchema], default: [] })
  messages: SupportMessage[];
}

export type SupportTicketDocument = HydratedDocument<SupportTicket>;
export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);
