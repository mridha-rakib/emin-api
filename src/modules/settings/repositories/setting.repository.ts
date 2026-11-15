import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Setting, SettingDocument } from '../schemas/setting.schema';

@Injectable()
export class SettingRepository extends BaseRepository<SettingDocument> {
  constructor(@InjectModel(Setting.name) private readonly settingModel: Model<SettingDocument>) {
    super(settingModel);
  }
}