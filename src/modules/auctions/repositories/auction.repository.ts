import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Auction, AuctionDocument } from '../schemas/auction.schema';

@Injectable()
export class AuctionRepository extends BaseRepository<AuctionDocument> {
  constructor(@InjectModel(Auction.name) private readonly auctionModel: Model<AuctionDocument>) {
    super(auctionModel);
  }
}