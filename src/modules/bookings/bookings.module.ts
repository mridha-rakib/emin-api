import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { BookingRepository } from './repositories/booking.repository';
import { BookingService } from './services/booking.service';
import { BookingController } from './controllers/booking.controller';
import { AuthModule } from '../auth/auth.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]), AuthModule, PaymentsModule],
  controllers: [BookingController],
  providers: [BookingRepository, BookingService],
  exports: [MongooseModule, BookingRepository, BookingService],
})
export class BookingsModule {}