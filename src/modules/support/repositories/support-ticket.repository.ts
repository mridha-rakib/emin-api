import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TicketStatus } from '../../../common/enums/domain.enums';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { SupportTicket, SupportTicketDocument } from '../schemas/support-ticket.schema';

type SupportMessageInput = {
  senderId?: string;
  senderRole: 'user' | 'admin' | 'guest';
  senderName?: string;
  message: string;
  attachments: [];
  createdAt: Date;
};

@Injectable()
export class SupportTicketRepository extends BaseRepository<SupportTicketDocument> {
  constructor(@InjectModel(SupportTicket.name) private readonly supportTicketModel: Model<SupportTicketDocument>) {
    super(supportTicketModel);
  }

  findByUser(userId: string) {
    return this.supportTicketModel.find({ userId: new Types.ObjectId(userId) }).sort({ updatedAt: -1 }).limit(50).exec();
  }

  appendMessage(id: string, message: SupportMessageInput, status: TicketStatus) {
    return this.supportTicketModel
      .findByIdAndUpdate(id, { $push: { messages: message }, $set: { status } }, { new: true })
      .exec();
  }
}