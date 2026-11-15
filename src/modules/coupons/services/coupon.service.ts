import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CouponDocument } from '../schemas/coupon.schema';
import { CreateCouponDto } from '../dto/create-coupon.dto';
import { UpdateCouponDto } from '../dto/update-coupon.dto';
import { CouponRepository } from '../repositories/coupon.repository';

@Injectable()
export class CouponService {
  constructor(private readonly repository: CouponRepository) {}

  create(dto: CreateCouponDto) {
    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<CouponDocument>));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: UpdateCouponDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(id: string) {
    return this.repository.deleteOne({ _id: id });
  }
}