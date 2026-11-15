import { Injectable, MethodNotAllowedException } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CommissionDocument } from '../schemas/commission.schema';
import { CreateCommissionDto } from '../dto/create-commission.dto';
import { UpdateCommissionDto } from '../dto/update-commission.dto';
import { CommissionRepository } from '../repositories/commission.repository';

@Injectable()
export class CommissionService {
  constructor(private readonly repository: CommissionRepository) {}

  create(dto: CreateCommissionDto) {
    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<CommissionDocument>));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: UpdateCommissionDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(_id: string): never {
    throw new MethodNotAllowedException('Commission records cannot be deleted.');
  }
}