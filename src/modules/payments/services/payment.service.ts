import { Injectable, MethodNotAllowedException } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaymentDocument } from '../schemas/payment.schema';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { UpdatePaymentDto } from '../dto/update-payment.dto';
import { PaymentRepository } from '../repositories/payment.repository';

@Injectable()
export class PaymentService {
  constructor(private readonly repository: PaymentRepository) {}

  create(dto: CreatePaymentDto) {
    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<PaymentDocument>));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: UpdatePaymentDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(_id: string): never {
    throw new MethodNotAllowedException('Payment records cannot be deleted.');
  }
}