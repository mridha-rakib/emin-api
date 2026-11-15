import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { UserSubscription, UserSubscriptionDocument } from '../schemas/user-subscription.schema';

@Injectable()
export class UserSubscriptionRepository extends BaseRepository<UserSubscriptionDocument> {
  constructor(@InjectModel(UserSubscription.name) model: Model<UserSubscriptionDocument>) {
    super(model);
  }
}