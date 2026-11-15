import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { SellerProfile, SellerProfileDocument } from '../schemas/seller-profile.schema';

@Injectable()
export class SellerProfileRepository extends BaseRepository<SellerProfileDocument> {
  constructor(@InjectModel(SellerProfile.name) private readonly sellerProfileModel: Model<SellerProfileDocument>) {
    super(sellerProfileModel);
  }
}