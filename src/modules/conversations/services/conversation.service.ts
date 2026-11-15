import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ConversationDocument } from '../schemas/conversation.schema';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { UpdateConversationDto } from '../dto/update-conversation.dto';
import { ConversationRepository } from '../repositories/conversation.repository';

@Injectable()
export class ConversationService {
  constructor(private readonly repository: ConversationRepository) {}

  create(dto: CreateConversationDto) {
    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<ConversationDocument>));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: UpdateConversationDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(id: string) {
    return this.repository.deleteOne({ _id: id });
  }
}