import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { AutoBid, AutoBidDocument } from '../schemas/auto-bid.schema';

@Injectable()
export class AutoBidRepository extends BaseRepository<AutoBidDocument> {
  constructor(@InjectModel(AutoBid.name) private readonly autoBidModel: Model<AutoBidDocument>) {
    super(autoBidModel);
  }
}