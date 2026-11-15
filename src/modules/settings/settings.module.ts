import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Setting, SettingSchema } from './schemas/setting.schema';
import { SettingRepository } from './repositories/setting.repository';
import { SettingService } from './services/setting.service';
import { SettingController } from './controllers/setting.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Setting.name, schema: SettingSchema }])],
  controllers: [SettingController],
  providers: [SettingRepository, SettingService],
  exports: [MongooseModule, SettingRepository, SettingService],
})
export class SettingsModule {}