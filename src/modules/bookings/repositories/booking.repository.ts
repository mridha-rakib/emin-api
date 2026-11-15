import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Booking, BookingDocument } from '../schemas/booking.schema';

@Injectable()
export class BookingRepository extends BaseRepository<BookingDocument> {
  constructor(@InjectModel(Booking.name) model: Model<BookingDocument>) {
    super(model);
  }
}