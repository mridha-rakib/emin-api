import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Commission, CommissionDocument } from '../schemas/commission.schema';

@Injectable()
export class CommissionRepository extends BaseRepository<CommissionDocument> {
  constructor(@InjectModel(Commission.name) private readonly commissionModel: Model<CommissionDocument>) {
    super(commissionModel);
  }
}