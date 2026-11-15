import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Shipment, ShipmentDocument } from '../schemas/shipment.schema';

@Injectable()
export class ShipmentRepository extends BaseRepository<ShipmentDocument> {
  constructor(@InjectModel(Shipment.name) private readonly shipmentModel: Model<ShipmentDocument>) {
    super(shipmentModel);
  }
}