import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Bid, BidDocument } from '../schemas/bid.schema';

@Injectable()
export class BidRepository extends BaseRepository<BidDocument> {
  constructor(@InjectModel(Bid.name) private readonly bidModel: Model<BidDocument>) {
    super(bidModel);
  }
}