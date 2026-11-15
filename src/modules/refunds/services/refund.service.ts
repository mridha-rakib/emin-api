import { Injectable, MethodNotAllowedException } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RefundDocument } from '../schemas/refund.schema';
import { CreateRefundDto } from '../dto/create-refund.dto';
import { UpdateRefundDto } from '../dto/update-refund.dto';
import { RefundRepository } from '../repositories/refund.repository';

@Injectable()
export class RefundService {
  constructor(private readonly repository: RefundRepository) {}

  create(dto: CreateRefundDto) {
    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<RefundDocument>));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: UpdateRefundDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(_id: string): never {
    throw new MethodNotAllowedException('Refund records cannot be deleted.');
  }
}