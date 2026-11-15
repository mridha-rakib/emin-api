import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Banner, BannerDocument } from '../schemas/banner.schema';

@Injectable()
export class BannerRepository extends BaseRepository<BannerDocument> {
  constructor(@InjectModel(Banner.name) private readonly bannerModel: Model<BannerDocument>) {
    super(bannerModel);
  }
}