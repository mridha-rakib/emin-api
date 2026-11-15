import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Coupon, CouponSchema } from './schemas/coupon.schema';
import { CouponRepository } from './repositories/coupon.repository';
import { CouponService } from './services/coupon.service';
import { CouponController } from './controllers/coupon.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Coupon.name, schema: CouponSchema }])],
  controllers: [CouponController],
  providers: [CouponRepository, CouponService],
  exports: [MongooseModule, CouponRepository, CouponService],
})
export class CouponsModule {}