import { Body, Controller, Param, Post } from '@nestjs/common';
import { ParseObjectIdPipe } from '../../../common/pipes/parse-object-id.pipe';
import { PlaceBidDto } from '../../auctions/dto/place-bid.dto';
import { BidService } from '../services/bid.service';

@Controller('auctions')
export class BiddingController {
  constructor(private readonly bidService: BidService) {}

  @Post(':auctionId/bids')
  placeBid(@Param('auctionId', ParseObjectIdPipe) auctionId: string, @Body() dto: PlaceBidDto) {
    return this.bidService.placeBid(auctionId, dto.bidderId, dto.amount);
  }
}