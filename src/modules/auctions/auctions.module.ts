import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Auction, AuctionSchema } from './schemas/auction.schema';
import { AuctionRepository } from './repositories/auction.repository';
import { AuctionService } from './services/auction.service';
import { AuctionController } from './controllers/auction.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Auction.name, schema: AuctionSchema }])],
  controllers: [AuctionController],
  providers: [AuctionRepository, AuctionService],
  exports: [MongooseModule, AuctionRepository, AuctionService],
})
export class AuctionsModule {}