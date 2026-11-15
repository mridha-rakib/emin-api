import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Wishlist, WishlistDocument } from '../schemas/wishlist.schema';

@Injectable()
export class WishlistRepository extends BaseRepository<WishlistDocument> {
  constructor(@InjectModel(Wishlist.name) private readonly wishlistModel: Model<WishlistDocument>) {
    super(wishlistModel);
  }
}