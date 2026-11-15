import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { BannerDocument } from '../schemas/banner.schema';
import { CreateBannerDto } from '../dto/create-banner.dto';
import { UpdateBannerDto } from '../dto/update-banner.dto';
import { BannerRepository } from '../repositories/banner.repository';

@Injectable()
export class BannerService {
  constructor(private readonly repository: BannerRepository) {}

  create(dto: CreateBannerDto) {
    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<BannerDocument>));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: UpdateBannerDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(id: string) {
    return this.repository.deleteOne({ _id: id });
  }
}