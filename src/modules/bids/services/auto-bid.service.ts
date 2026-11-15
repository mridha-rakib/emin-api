import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AutoBidDocument } from '../schemas/auto-bid.schema';
import { CreateAutoBidDto } from '../dto/create-auto-bid.dto';
import { UpdateAutoBidDto } from '../dto/update-auto-bid.dto';
import { AutoBidRepository } from '../repositories/auto-bid.repository';

@Injectable()
export class AutoBidService {
  constructor(private readonly repository: AutoBidRepository) {}

  create(dto: CreateAutoBidDto) {
    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<AutoBidDocument>));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: UpdateAutoBidDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(id: string) {
    return this.repository.deleteOne({ _id: id });
  }
}