import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { AiNegotiationLog, AiNegotiationLogDocument } from '../schemas/ai-negotiation-log.schema';

@Injectable()
export class AiNegotiationLogRepository extends BaseRepository<AiNegotiationLogDocument> {
  constructor(@InjectModel(AiNegotiationLog.name) model: Model<AiNegotiationLogDocument>) {
    super(model);
  }
}