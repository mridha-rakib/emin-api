import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RawPayloadDto } from '../../../common/dto/raw-payload.dto';
import { UserSubscriptionRepository } from '../repositories/user-subscription.repository';

@Injectable()
export class UserSubscriptionService {
  constructor(private readonly repository: UserSubscriptionRepository) {}

  create(dto: RawPayloadDto) {
    return this.repository.createOne(dto.payload ?? {});
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: RawPayloadDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? {} });
  }

  remove(id: string) {
    return this.repository.deleteOne({ _id: id });
  }

  
}