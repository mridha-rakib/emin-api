import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Payment, PaymentDocument } from '../schemas/payment.schema';

@Injectable()
export class PaymentRepository extends BaseRepository<PaymentDocument> {
  constructor(@InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>) {
    super(paymentModel);
  }
}