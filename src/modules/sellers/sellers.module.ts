import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SellerProfile, SellerProfileSchema } from './schemas/seller-profile.schema';
import { SellerProfileRepository } from './repositories/seller-profile.repository';
import { SellerProfileService } from './services/seller-profile.service';
import { SellerProfileController } from './controllers/seller-profile.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: SellerProfile.name, schema: SellerProfileSchema }])],
  controllers: [SellerProfileController],
  providers: [SellerProfileRepository, SellerProfileService],
  exports: [MongooseModule, SellerProfileRepository, SellerProfileService],
})
export class SellersModule {}