import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { WalletTransaction, WalletTransactionDocument } from '../schemas/wallet-transaction.schema';

@Injectable()
export class WalletTransactionRepository extends BaseRepository<WalletTransactionDocument> {
  constructor(@InjectModel(WalletTransaction.name) private readonly walletTransactionModel: Model<WalletTransactionDocument>) {
    super(walletTransactionModel);
  }
}