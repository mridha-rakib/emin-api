import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CartDocument } from '../schemas/cart.schema';
import { CreateCartDto } from '../dto/create-cart.dto';
import { UpdateCartDto } from '../dto/update-cart.dto';
import { CartRepository } from '../repositories/cart.repository';

@Injectable()
export class CartService {
  constructor(private readonly repository: CartRepository) {}

  create(dto: CreateCartDto) {
    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<CartDocument>));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: UpdateCartDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(id: string) {
    return this.repository.deleteOne({ _id: id });
  }
}