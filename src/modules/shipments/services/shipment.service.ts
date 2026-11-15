import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ShipmentDocument } from '../schemas/shipment.schema';
import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { UpdateShipmentDto } from '../dto/update-shipment.dto';
import { ShipmentRepository } from '../repositories/shipment.repository';

@Injectable()
export class ShipmentService {
  constructor(private readonly repository: ShipmentRepository) {}

  create(dto: CreateShipmentDto) {
    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<ShipmentDocument>));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: UpdateShipmentDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(id: string) {
    return this.repository.deleteOne({ _id: id });
  }
}