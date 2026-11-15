import { Injectable, MethodNotAllowedException } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { WithdrawalDocument } from '../schemas/withdrawal.schema';
import { CreateWithdrawalDto } from '../dto/create-withdrawal.dto';
import { UpdateWithdrawalDto } from '../dto/update-withdrawal.dto';
import { WithdrawalRepository } from '../repositories/withdrawal.repository';

@Injectable()
export class WithdrawalService {
  constructor(private readonly repository: WithdrawalRepository) {}

  create(dto: CreateWithdrawalDto) {
    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<WithdrawalDocument>));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: UpdateWithdrawalDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(_id: string): never {
    throw new MethodNotAllowedException('Withdrawal records cannot be deleted.');
  }
}