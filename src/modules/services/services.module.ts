import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceListing, ServiceListingSchema } from './schemas/service-listing.schema';
import { ServiceListingRepository } from './repositories/service-listing.repository';
import { ServiceListingService } from './services/service-listing.service';
import { ServiceListingController } from './controllers/service-listing.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: ServiceListing.name, schema: ServiceListingSchema }]), AuthModule],
  controllers: [ServiceListingController],
  providers: [ServiceListingRepository, ServiceListingService],
  exports: [MongooseModule, ServiceListingRepository, ServiceListingService],
})
export class ServicesModule {}