import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RawPayloadDto } from '../../../common/dto/raw-payload.dto';
import { AuthService } from '../../auth/auth.service';
import { PayoutService } from '../../payments/services/payout.service';
import { BookingRepository } from '../repositories/booking.repository';

/** Fields the booking form sends that have no column of their own; they are kept in `metadata`. */
const METADATA_FIELDS = ['notes', 'timeSlot', 'details'];

@Injectable()
export class BookingService {
  constructor(
    private readonly repository: BookingRepository,
    private readonly auth: AuthService,
    private readonly payouts: PayoutService,
  ) {}

  async create(dto: RawPayloadDto, authorization?: string) {
    const payload = { ...(dto.payload ?? {}) };
    const metadata: Record<string, unknown> = { ...((payload.metadata as Record<string, unknown>) ?? {}) };
    METADATA_FIELDS.forEach((field) => {
      if (payload[field] !== undefined && payload[field] !== '') metadata[field] = payload[field];
      delete payload[field];
    });

    if (authorization) {
      const customer = await this.auth.requireUser(authorization).catch(() => null);
      if (customer) {
        payload.customerId = customer._id as Types.ObjectId;
        payload.customerEmail = customer.email;
      }
    }

    return this.repository.createOne({ ...payload, metadata });
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  async update(id: string, dto: RawPayloadDto) {
    const booking = await this.repository.updateOne({ _id: id }, { $set: dto.payload ?? {} });
    const status = String((dto.payload as { status?: string } | undefined)?.status || '').toLowerCase();
    if (status !== 'completed' || !booking) return booking;
    const payout = await this.payouts.releaseSource('BOOKING', booking._id.toString());
    return { ...booking.toObject(), payout };
  }

  remove(id: string) {
    return this.repository.deleteOne({ _id: id });
  }
}
