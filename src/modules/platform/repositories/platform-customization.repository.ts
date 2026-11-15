import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { PlatformCustomization, PlatformCustomizationDocument } from '../schemas/platform-customization.schema';

@Injectable()
export class PlatformCustomizationRepository extends BaseRepository<PlatformCustomizationDocument> {
  constructor(@InjectModel(PlatformCustomization.name) model: Model<PlatformCustomizationDocument>) {
    super(model);
  }
}