import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AuctionDocument } from '../schemas/auction.schema';
import { CreateAuctionDto } from '../dto/create-auction.dto';
import { UpdateAuctionDto } from '../dto/update-auction.dto';
import { AuctionRepository } from '../repositories/auction.repository';

@Injectable()
export class AuctionService {
  constructor(private readonly repository: AuctionRepository) {}

  create(dto: CreateAuctionDto) {
    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<AuctionDocument>));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: UpdateAuctionDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(id: string) {
    return this.repository.deleteOne({ _id: id });
  }
}