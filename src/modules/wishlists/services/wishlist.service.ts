import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { WishlistDocument } from '../schemas/wishlist.schema';
import { CreateWishlistDto } from '../dto/create-wishlist.dto';
import { UpdateWishlistDto } from '../dto/update-wishlist.dto';
import { WishlistRepository } from '../repositories/wishlist.repository';

@Injectable()
export class WishlistService {
  constructor(private readonly repository: WishlistRepository) {}

  create(dto: CreateWishlistDto) {
    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<WishlistDocument>));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: UpdateWishlistDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(id: string) {
    return this.repository.deleteOne({ _id: id });
  }
}