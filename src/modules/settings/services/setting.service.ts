import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { SettingDocument } from '../schemas/setting.schema';
import { CreateSettingDto } from '../dto/create-setting.dto';
import { UpdateSettingDto } from '../dto/update-setting.dto';
import { SettingRepository } from '../repositories/setting.repository';

@Injectable()
export class SettingService {
  constructor(private readonly repository: SettingRepository) {}

  create(dto: CreateSettingDto) {
    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<SettingDocument>));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: UpdateSettingDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(id: string) {
    return this.repository.deleteOne({ _id: id });
  }
}