import { ConflictException, Injectable, MethodNotAllowedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { TransactionHelper } from '../../../infrastructure/database/transaction.helper';
import { toDecimal128 } from '../../../common/utils/money.util';
import { BidStatus, BidType } from '../../../common/enums/domain.enums';
import { Auction, AuctionDocument } from '../../auctions/schemas/auction.schema';
import { BidDocument } from '../schemas/bid.schema';
import { CreateBidDto } from '../dto/create-bid.dto';
import { UpdateBidDto } from '../dto/update-bid.dto';
import { BidRepository } from '../repositories/bid.repository';

@Injectable()
export class BidService {
  constructor(
    private readonly repository: BidRepository,
    @InjectModel(Auction.name) private readonly auctions: Model<AuctionDocument>,
    private readonly tx: TransactionHelper,
  ) {}

  create(dto: CreateBidDto) {
    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<BidDocument>));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: UpdateBidDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(_id: string): never {
    throw new MethodNotAllowedException('Bid records cannot be deleted.');
  }

  async placeBid(auctionId: string, bidderId: string, amount: string) {
    return this.tx.withTransaction(async (session) => {
      const bid = await this.repository.createOne({
        auctionId: new Types.ObjectId(auctionId),
        bidderId: new Types.ObjectId(bidderId),
        amount: toDecimal128(amount),
        type: BidType.MANUAL,
        status: BidStatus.VALID,
      } as Partial<BidDocument>, session);

      const updated = await this.auctions.updateOne(
        { _id: auctionId, endAt: { $gt: new Date() }, currentPrice: { $lt: toDecimal128(amount) } },
        { $set: { currentPrice: toDecimal128(amount), winningBidId: bid._id, winningUserId: new Types.ObjectId(bidderId) }, $inc: { totalBids: 1 } },
        { session },
      );

      if (updated.modifiedCount !== 1) {
        throw new ConflictException('Bid rejected by current auction state.');
      }

      return bid;
    });
  }
}
