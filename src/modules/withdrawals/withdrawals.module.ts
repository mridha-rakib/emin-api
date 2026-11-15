import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Withdrawal, WithdrawalSchema } from './schemas/withdrawal.schema';
import { WithdrawalRepository } from './repositories/withdrawal.repository';
import { WithdrawalService } from './services/withdrawal.service';
import { WithdrawalController } from './controllers/withdrawal.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Withdrawal.name, schema: WithdrawalSchema }])],
  controllers: [WithdrawalController],
  providers: [WithdrawalRepository, WithdrawalService],
  exports: [MongooseModule, WithdrawalRepository, WithdrawalService],
})
export class WithdrawalsModule {}