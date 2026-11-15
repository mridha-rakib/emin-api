import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Page, PageDocument } from '../schemas/page.schema';

@Injectable()
export class PageRepository extends BaseRepository<PageDocument> {
  constructor(@InjectModel(Page.name) private readonly pageModel: Model<PageDocument>) {
    super(pageModel);
  }
}