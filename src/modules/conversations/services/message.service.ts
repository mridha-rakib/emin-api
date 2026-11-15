import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { MessageDocument } from '../schemas/message.schema';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { MessageRepository } from '../repositories/message.repository';
import { ConversationRepository } from '../repositories/conversation.repository';

@Injectable()
export class MessageService {
  constructor(
    private readonly repository: MessageRepository,
    private readonly conversationRepository: ConversationRepository,
  ) {}

  async create(dto: CreateMessageDto) {
    const payload = dto.payload ?? (dto as unknown as Partial<MessageDocument>);
    const created = await this.repository.createOne(payload);
    if (created.conversationId) {
      await this.conversationRepository.updateOne(
        { _id: created.conversationId },
        {
          $set: {
            lastMessage: {
              text: created.text ?? '',
              senderId: created.senderId,
              createdAt: created.createdAt,
            },
          },
        },
      );
    }
    return created;
  }

  findAll(query: PaginationQueryDto, conversationId?: string) {
    return this.repository.paginate(conversationId ? { conversationId } : {}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: UpdateMessageDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(id: string) {
    return this.repository.deleteOne({ _id: id });
  }
}
