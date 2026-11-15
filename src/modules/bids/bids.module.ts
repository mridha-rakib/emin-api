import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bid, BidSchema } from './schemas/bid.schema';
import { BidRepository } from './repositories/bid.repository';
import { BidService } from './services/bid.service';
import { BidController } from './controllers/bid.controller';
import { BiddingController } from './controllers/bidding.controller';
import { AutoBid, AutoBidSchema } from './schemas/auto-bid.schema';
import { AutoBidRepository } from './repositories/auto-bid.repository';
import { AutoBidService } from './services/auto-bid.service';
import { AutoBidController } from './controllers/auto-bid.controller';
import { TransactionHelper } from '../../infrastructure/database/transaction.helper';
import { Auction, AuctionSchema } from '../auctions/schemas/auction.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Bid.name, schema: BidSchema }, { name: AutoBid.name, schema: AutoBidSchema }, { name: Auction.name, schema: AuctionSchema }])],
  controllers: [BidController, AutoBidController, BiddingController],
  providers: [BidRepository, BidService, AutoBidRepository, AutoBidService, TransactionHelper],
  exports: [MongooseModule, BidRepository, BidService, AutoBidRepository, AutoBidService],
})
export class BidsModule {}