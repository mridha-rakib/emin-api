import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlatformCustomization, PlatformCustomizationSchema } from './schemas/platform-customization.schema';
import { PlatformCustomizationRepository } from './repositories/platform-customization.repository';
import { PlatformCustomizationService } from './services/platform-customization.service';
import { PlatformCustomizationController } from './controllers/platform-customization.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: PlatformCustomization.name, schema: PlatformCustomizationSchema }])],
  controllers: [PlatformCustomizationController],
  providers: [PlatformCustomizationRepository, PlatformCustomizationService],
  exports: [MongooseModule, PlatformCustomizationRepository, PlatformCustomizationService],
})
export class PlatformModule {}