import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Withdrawal, WithdrawalDocument } from '../schemas/withdrawal.schema';

@Injectable()
export class WithdrawalRepository extends BaseRepository<WithdrawalDocument> {
  constructor(@InjectModel(Withdrawal.name) private readonly withdrawalModel: Model<WithdrawalDocument>) {
    super(withdrawalModel);
  }
}