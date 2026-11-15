import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Cart, CartDocument } from '../schemas/cart.schema';

@Injectable()
export class CartRepository extends BaseRepository<CartDocument> {
  constructor(@InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>) {
    super(cartModel);
  }
}