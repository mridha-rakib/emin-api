import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Coupon, CouponDocument } from '../schemas/coupon.schema';

@Injectable()
export class CouponRepository extends BaseRepository<CouponDocument> {
  constructor(@InjectModel(Coupon.name) private readonly couponModel: Model<CouponDocument>) {
    super(couponModel);
  }
}