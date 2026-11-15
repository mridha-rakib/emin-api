import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Wallet, WalletDocument } from '../schemas/wallet.schema';

@Injectable()
export class WalletRepository extends BaseRepository<WalletDocument> {
  constructor(@InjectModel(Wallet.name) private readonly walletModel: Model<WalletDocument>) {
    super(walletModel);
  }
}