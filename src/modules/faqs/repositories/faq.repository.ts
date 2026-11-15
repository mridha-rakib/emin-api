import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Faq, FaqDocument } from '../schemas/faq.schema';

@Injectable()
export class FaqRepository extends BaseRepository<FaqDocument> {
  constructor(@InjectModel(Faq.name) model: Model<FaqDocument>) {
    super(model);
  }
}