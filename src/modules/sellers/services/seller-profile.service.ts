import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { SellerProfileDocument } from '../schemas/seller-profile.schema';
import { CreateSellerProfileDto } from '../dto/create-seller-profile.dto';
import { UpdateSellerProfileDto } from '../dto/update-seller-profile.dto';
import { SellerProfileRepository } from '../repositories/seller-profile.repository';

@Injectable()
export class SellerProfileService {
  constructor(private readonly repository: SellerProfileRepository) {}

  create(dto: CreateSellerProfileDto) {
    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<SellerProfileDocument>));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: UpdateSellerProfileDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(id: string) {
    return this.repository.updateOne({ _id: id }, { $set: { deletedAt: new Date() } });
  }
}