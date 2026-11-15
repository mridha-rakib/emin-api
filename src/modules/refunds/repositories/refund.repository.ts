import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Refund, RefundDocument } from '../schemas/refund.schema';

@Injectable()
export class RefundRepository extends BaseRepository<RefundDocument> {
  constructor(@InjectModel(Refund.name) private readonly refundModel: Model<RefundDocument>) {
    super(refundModel);
  }
}