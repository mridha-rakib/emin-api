import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Refund, RefundSchema } from './schemas/refund.schema';
import { RefundRepository } from './repositories/refund.repository';
import { RefundService } from './services/refund.service';
import { RefundController } from './controllers/refund.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Refund.name, schema: RefundSchema }])],
  controllers: [RefundController],
  providers: [RefundRepository, RefundService],
  exports: [MongooseModule, RefundRepository, RefundService],
})
export class RefundsModule {}